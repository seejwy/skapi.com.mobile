<template lang="pug">
NavBarProxy
    template(v-slot:leftButton)
        Icon.clickable.backButton(@click="emit('close')") left
    template(v-slot:title)
        div Upload Files
    template(v-slot:rightButton)
        div(style="position: relative; width: 28px; height: 28px;" v-if="isSaving && !isComplete")
            LoadingCircle(style="--bgColor: 80, 80, 80; --ringColor: 250, 250, 250;")
        span(v-else @click="uploadFiles" style="font-weight: bold; cursor: pointer" :style="{opacity: filesToUpload <= 0 || isComplete || isSaving ? .25 : 1}") Upload
.overlay-container(:loading="isDisabled || null")
    .actions    
        sui-button.lineButton(@click="addFileButtonHandler" :disabled="isSaving")  + Files
        sui-button.lineButton(@click="addFolderButtonHandler" :disabled="isSaving")  + Folders
        sui-button.withIcon.lineButton(@click="deleteFiles" :disabled="!isSaving || !selectedFiles?.length")
            Icon trash
        input(ref="folderUpload" type="file" webkitdirectory multiple hidden @change="e => addFolders(e)")
        input(ref="fileUpload" type="file" multiple hidden @change="e => addFiles(e)")
    .directory 
        span {{ currentDirectory }}
    .filesContainer
        template(v-if="Object.keys(fileList).length")
            label.file(v-for="(file, path) in fileList")
                sui-input(v-if="!isSaving && !isComplete" type="checkbox" :value="path" :disabled="isSaving" :checked="selectedFiles.includes(path)" @change="selectionHandler")
                .progressBar(v-else @click="()=>abortUpload=path" :class="{'started': file.progress !== 100 && file.currentProgress > 0 && file.currentProgress < 100, 'complete': file.currentProgress === 100, 'failed': file.progress === false}" :style="{'--progress': 'conic-gradient(#5AD858 ' + (file.currentProgress ? file.currentProgress * 3.6 : 0) + 'deg, rgba(255,255,255,.1) 0deg)'}")
                    .circle
                    .circle
                .path-wrapper
                    span.path {{ path }}
        template(v-else)
            div.noFiles
                div.title No Files
                p You have not uploaded any files
        pre {{ service.files }}
</template>
<!-- script below -->
<script setup>
import { inject, ref, reactive, onBeforeUnmount } from 'vue';
import { state, skapi } from '@/main';
import { extractFileName } from '@/helper/files';
import { useRouter } from 'vue-router';

import NavBarProxy from '@/components/NavBarProxy.vue';
import LoadingCircle from '@/components/LoadingCircle.vue';
import Icon from '@/components/Icon.vue';

let router = useRouter();
const emit = defineEmits(['close']);
const props = defineProps(['currentDirectory']);
let appStyle = inject('appStyle');
let service = inject('service');
const errorMessage = ref('');

let fileList = ref({});
const fileUpload = ref(null);
const folderUpload = ref(null);
const selectedFiles = ref([]);
const filesToUpload = ref(0);
const isSaving = ref(false);
const isComplete = ref(false);
const numberOfFailedUploads = ref(-1);

const addFileButtonHandler = () => {
    const parent = fileUpload.value.click();
}

const addFolderButtonHandler = () => {
    const parent = folderUpload.value.click();
}

const addFolders = (event) => {
    if (isComplete.value) {
        fileList.value = {}
        isComplete.value = false
    }
    const files = event.target.files;

    for (let file of files) {
        let folderName = props.currentDirectory.slice(1) + file.webkitRelativePath;
        fileList.value[folderName] = {
            file,
            progress: 0
        };
        filesToUpload.value++;
    }

    folderUpload.value.value = '';
}

const addFiles = (event) => {
    if (isComplete.value) {
        fileList.value = {};
        filesToUpload.value = 0;
        isComplete.value = false;
    }

    const files = event.target.files;

    for (let file of files) {
        let fileName = props.currentDirectory.slice(1) + file.name;

        fileList.value[fileName] = {
            file,
            progress: 0
        };
        filesToUpload.value++;
    }

    fileUpload.value.value = '';
}

const deleteFiles = () => {
    for (let file of selectedFiles.value) {
        delete fileList.value[file]
    }

    selectedFiles.value = []
}

const selectionHandler = (e) => {
    if (e.target.checked) {
        selectedFiles.value.push(e.target.value)
    } else {
        selectedFiles.value.splice(selectedFiles.value.indexOf(e.target.value), 1);
    }
}

let abortUpload = '';

const uploadFiles = async () => {
    if (filesToUpload.value <= 0) return false;

    let directoryArray = props.currentDirectory.slice(0, -1).split('/');
    console.log(directoryArray);

    function saveToServiceFiles(file) {
        let fileArray = file.name.split('/');
        let serviceFolder = service.value.files.list;

        for(let i = 0; i < fileArray.length - 1; i++) {
            if(!serviceFolder[fileArray[i] + '/']) {
                serviceFolder[fileArray[i] + '/'] = {
                    type: 'folder',
                    files: {
                        endOfList: false,
                        list: {}
                    }
                }
            }

            serviceFolder = serviceFolder[fileArray[i] + '/'].files.list;
        }
        let fileName = extractFileName(file.name)
        serviceFolder[fileName] = {
            type: "file",
            name: fileName,
            url: `https://${service.value.subdomain}.skapi.com/${fileName}`
        };
    }

    let formData = new FormData();

    for (let key in fileList.value) {
        formData.append(key, fileList.value[key].file, key);
    }
    isSaving.value = true;

    let interval = null;
    let progress = 0;
    let testTimer = 0;
    try {
        state.blockingPromise = await skapi.uploadFiles(formData, {
            service: service.value.service,
            request: 'host',
            progress: (e) => {
                if (abortUpload === e.currentFile.name && e.progress !== 100) {
                    e.abort();
                    fileList.value[e.currentFile.name].progress = false;
                    abortUpload = '';
                } else {
                    if (e.failed.length > numberOfFailedUploads.value) {
                        numberOfFailedUploads.value++;
                        filesToUpload.value--;
                    }
                    progress = e.progress;
                    fileList.value[e.currentFile.name].abort = e.abort;
                    fileList.value[e.currentFile.name].progress = e.progress;
                    if (!fileList.value[e.currentFile.name].currentProgress) fileList.value[e.currentFile.name].currentProgress = 0;
                    if(!interval) {
                        interval = setInterval(() => {
                            testTimer++;
                            try {

                                if (fileList.value[e.currentFile.name].currentProgress < progress) {
                                    fileList.value[e.currentFile.name].currentProgress += 1;
                                }

                                if (fileList.value[e.currentFile.name].currentProgress === progress) {
                                    filesToUpload.value--;
                                    // service.value.files[e.currentFile.name] = `https://${service.value.subdomain}.skapi.com/${e.currentFile.name}`
                                    saveToServiceFiles(e.currentFile);
                                    clearInterval(interval);
                                    interval = null;
                                }
                            } catch(e) {
                                throw e;
                                clearInterval(interval);
                            }
                        }, 5);
                    }
                }
            }
        });
    } catch (e) {
        console.log({ e });
    } finally {
        isSaving.value = false;
        isComplete.value = true;
    }
}

appStyle.background = '#333333';
</script>

<style lang="less" scoped>
@import '@/assets/variables.less';

.overlay-container {
    margin-top: var(--head-space);

    .input {
        margin: 20px auto;

        label {
            display: block;
            text-align: left;
            font-weight: bold;
            color: rgba(255, 255, 255, .6);
            margin-bottom: 8px;
        }

        sui-input {
            width: 100%;
        }
    }

    .directory {
        flex-shrink: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        direction: rtl;
        text-align: left;
        display: inline-block;

        span {
            unicode-bidi: plaintext;
        }
    }
}

.actions {
    text-align: right;

    sui-button {
        vertical-align: middle;

        &:not(:last-child) {
            margin-right: 12px;
        }

        &.withIcon {
            padding: 8px 8px;
        }
    }
}

.filesContainer {
    margin: 28px -20px;

    @media @phone {
        margin: 28px -16px;
    }

    .file {
        display: flex;
        align-items: center;
        height: 52px;
        padding: 8px 20px;

        .path-wrapper {
            display: inline-block;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            direction: rtl;
            text-align: left;

            span.path {
                unicode-bidi: plaintext;
            }
        }

        .progressBar {
            flex-shrink: 0;
            display: inline-block;
            vertical-align: middle;
            width: 20px;
            height: 20px;
            background: var(--progress);
            border-radius: 50%;
            position: relative;
            margin-right: 16px;

            .circle {
                border: 1px solid white;
                height: 20px;
                width: 20px;
                border-radius: 50%;
                position: absolute;
                opacity: 0;

                &~.circle {
                    border: 1px solid white;
                    opacity: 0;
                }
            }

            &::before {
                content: '';
                position: absolute;
                top: calc(50% - (15px / 2));
                left: calc(50% - (15px / 2));
                display: block;
                width: 15px;
                height: 15px;
                border-radius: 50%;
                background-color: #333;
            }

            &.started {
                &::after {
                    position: absolute;
                    content: url("data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 20 20' fill='black' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='20,5.78 18.22,4 12,10.22 5.78,4 4,5.78 10.22,12 4,18.22 5.78,20 12,13.78 18.22,20 20,18.22 13.78,12 ' fill='white'/%3E%3C/svg%3E");
                    top: 50%;
                    left: 50%;
                    transform: translate(-6px, -11px);
                }
            }

            &.complete {
                .circle {
                    animation: ripple 0.5s ease;

                    &~.circle {
                        animation: smallRipple .3s ease;
                    }
                }

                &::before {
                    top: 0;
                    left: 0;
                    width: 20px;
                    height: 20px;
                    background-color: #5AD858;
                    animation: bounce 0.2s ease
                }

                &::after {
                    position: absolute;
                    content: url("data:image/svg+xml,%3Csvg width='15' height='15' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9.31,18.6L3,12.29l1.54-1.51l4.77,4.77L19.46,5.4L21,6.91L9.31,18.6z' fill='white'/%3E%3C/svg%3E");
                    top: 50%;
                    left: 50%;
                    transform: translate(-9px, -9px);
                }
            }

            &.failed {
                &::before {
                    top: 0;
                    left: 0;
                    width: 20px;
                    height: 20px;
                    background-color: #F04E4E;
                    animation: bounce 0.2s ease
                }

                &::after {
                    position: absolute;
                    content: url("data:image/svg+xml,%3Csvg width='15' height='15' viewBox='0 0 20 20' fill='black' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m10.88,3.45h2.17v11.95h-2.17V3.45Zm2.17,15.21v2.17h-2.17v-2.17h2.17Z' fill='white'/%3E%3C/svg%3E");
                    top: 50%;
                    left: 50%;
                    transform: translate(-9px, -9px);
                }
            }
        }

        &:nth-child(even) {
            background: #4a4a4a;

            .progressBar::before {
                background-color: #4a4a4a;
            }

            .progressBar.complete::before {
                background-color: #5AD858;
            }

            .progressBar.failed::before {
                background-color: #F04E4E;
            }
        }

        @media @phone {
            padding: 8px 16px;
        }

        &>sui-input {
            margin-right: 16px;
        }
    }

    .noFiles {
        padding: 12px 16px;
        text-align: center;
        border-radius: 8px;

        .title {
            font-size: 28px;
        }

        .title,
        p {
            opacity: .4;
        }
    }
}

.pageAction {
    position: fixed;
    bottom: 76px;
    right: 16px;
    overflow: hidden;

    &>sui-button {
        z-index: 2;
    }

    &,
    &>div {
        display: flex;
        flex-direction: column-reverse;
        align-items: center;
        gap: 12px;
        width: 48px;
    }

    .v-enter-active,
    .v-leave-active {
        transition: opacity .1s ease, transform .1s ease;
        opacity: 1;
    }

    .v-enter-from,
    .v-leave-to {
        opacity: 0;
        transform: translateY(100px);
    }
}

@keyframes bounce {
    0% {
        transform: scale(1);
    }

    50% {

        transform: scale(1.1);
    }

    100% {
        transform: scale(1);
    }
}

@keyframes smallRipple {
    0% {
        opacity: 0.5;
    }

    100% {
        opacity: 0;
        transform: scale(1.5)
    }
}

@keyframes ripple {
    0% {
        opacity: 0.5;
    }

    100% {
        opacity: 0;
        transform: scale(1.7)
    }
}
</style>