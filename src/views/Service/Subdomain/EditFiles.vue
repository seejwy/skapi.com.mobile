<template lang="pug">
template(v-if="addView")
    AddFiles(@close="addView = false" :currentDirectory="currentDirectory")
template(v-else)
    NavBarProxy
        template(v-slot:title)
            div Modify Files
        template(v-slot:rightButton)
            div
    .overlay-container(:loading="isDisabled || null" :style="{'pointer-events': isDeleting ? 'none' : null}")
        .actions
            sui-button(@click="addView = true") Upload Files
            sui-button.withIcon.lineButton(@click="deleteFiles")
                Icon trash
        .directoryName
            Icon(@click="goUpDirectory") upload
            .path-wrapper
                span.path(v-for="(folder, index) in currentDirectoryArray" @click="jumpto(currentDirectoryArray.length - index)")
                    span {{ folder }}/
                span /
        .filesContainer
            .fetching(v-if="isFetching")
                Icon.animationRotation refresh
            template(v-else-if="Object.keys(service?.files?.list).length")
                template(v-for="(file, name) in directoryFiles")
                    .fileWrapper(v-if="file.type === 'folder'")
                        .file(:class="{fade: isDeleting && selectedFiles.includes(service.subdomain + currentDirectory + file.name)}")
                            sui-input(type="checkbox" :checked="selectedFiles.includes(service.subdomain + currentDirectory + file.name) || null" @change="checkboxHandler" :value="file.name")
                            Icon folder2
                            .path-wrapper(@click="goto(currentDirectory+=name)")
                                span.path {{ name }}             
                    .fileWrapper(v-else)
                        .file(:class="{fade: isDeleting && selectedFiles.includes(service.subdomain + currentDirectory + file.name)}")
                            sui-input(type="checkbox" :checked="selectedFiles.includes(service.subdomain + currentDirectory + file.name) || null" @change="checkboxHandler" :value="file.name")
                            Icon file
                            a(:href="file.url" download).path-wrapper
                                span.path {{ name }}
            template(v-else)
                div.noFiles
                    div.title No Files
                    p You have not uploaded any files
</template>
<!-- script below -->
<script setup>
import { inject, ref, reactive, onBeforeUnmount, computed } from 'vue';
import { state, skapi } from '@/main';
import { extractFileName } from '@/helper/files';
import { useRouter } from 'vue-router';

import NavBarProxy from '@/components/NavBarProxy.vue';
import LoadingCircle from '@/components/LoadingCircle.vue';
import Icon from '@/components/Icon.vue';
import AddFiles from '@/views/Service/Subdomain/AddFiles.vue';

let router = useRouter();
let appStyle = inject('appStyle');
let service = inject('service');
const errorMessage = ref('');
const selectedFiles = ref([]);
const currentDirectory = ref('/')
const isFetching = ref(false);
const addView = ref(false);
const isDeleting = ref(false);

const currentDirectoryArray = computed(() => {
    selectedFiles.value = [];
    return currentDirectory.value.split('/').reverse().filter((value) => {
        return value;
    });
})

const goto = (name) => {
    currentDirectory.value = name;
    getDirectory(name.slice(0, -1).split('/'));
}

const jumpto = (index) => {
    let localCurrentDirectory = currentDirectory.value;
    let directory = [...localCurrentDirectory.split('/').filter((path) => path)];
    goto(`/${directory.slice(0, index).join('/')}/`);
}

const directoryFiles = ref({});

const checkboxHandler = (e) => {
    if (e.target.checked) {
        selectedFiles.value.push(`${service.value.subdomain}${currentDirectory.value}${e.target.value}`);
    } else {
        selectedFiles.value.splice(selectedFiles.value.indexOf(`${service.value.subdomain}/${e.target.value}`), 1);
    }
}

const deleteFiles = () => {
    isDeleting.value = true;
    skapi.deleteHostFile({
        keys: selectedFiles.value,
        service: service.value.service
    }).then((res) => {
        selectedFiles.value.forEach(path => {
            let dir = service.value.files.list;
            let previousDir = service.value.files.list;
            let newPathArr = path.split('/');

            if (!newPathArr[newPathArr.length - 1]) {
                newPathArr.pop();
                newPathArr[newPathArr.length - 1] = newPathArr[newPathArr.length - 1] + '/';
            }

            for (let i = 1; i < newPathArr.length - 1; i++) {
                if (i > 1) {
                    previousDir = previousDir[newPathArr[i - 1] + '/'].files.list;
                }
                dir = dir[newPathArr[i] + '/'].files.list;
            }
            
            delete dir[newPathArr[newPathArr.length - 1]];

            if (Object.keys(dir).length === 0) {
                goUpDirectory();
                dir = service.value.files.list;
                delete previousDir[newPathArr[newPathArr.length - 2] + '/'];
            }
        });
        isDeleting.value = false;
        selectedFiles.value = [];
    });
    
}

const goUpDirectory = () => {
    if (currentDirectory.value !== '/') {
        let directory = currentDirectory.value.slice(0, -1).split('/');
        directory.splice(-1);
        getDirectory(directory);
        currentDirectory.value = `${directory.join('/')}/`;
    } else {
        getDirectory();
    }
}

const getDirectory = (directory) => {
    if (!directory && service.value.hasOwnProperty('files')) {
        directoryFiles.value = service.value.files.list;
        return true;
    }

    function getCurrentDirectoryFiles(directory) {
        let directoryFiles = service.value.files.list;
        if (directory) {
            for (let i = 1; i < directory.length; i++) {
                directoryFiles = directoryFiles[`${directory[i]}/`].files.list;
            }
        }
        return directoryFiles
    }

    if (service.value?.files) {
        let directoryCheck = service.value.files.list;
        for (let i = 1; i < directory.length; i++) {
            directoryCheck = Object.keys(directoryCheck?.[`${directory[i]}/`]?.files.list).length ? directoryCheck?.[`${directory[i]}/`]?.files.list : null;
        }
        if (!directoryCheck) {
            directoryFiles.value = {};
        } else {
            directoryFiles.value = getCurrentDirectoryFiles(directory);
            return true;
        }
    }

    directoryFiles.value = {};

    let params = {
        service: service.value.service
    }

    if (directory) {
        params.dir = `${directory.join('/')}/`;
    }

    isFetching.value = true;

    skapi.listHostDirectory(params).then((files) => {
        if (!service.value.hasOwnProperty('files')) {
            service.value.files = {
                endOfList: files.endOfList,
                list: {}
            }
        }

        for (let file of files.list) {
            if (file.type === 'folder') {
                let dir = file.name.substring(file.name.indexOf("/") + 1);

                if (directory) {
                    let currentDirectory = service.value;
                    for (let i = 1; i < directory.length; i++) {
                        currentDirectory = currentDirectory.files.list[`${directory[i]}/`]
                    }
                    let folderName = dir.slice(0, -1).split('/');

                    currentDirectory.files.endOfList = files.endOfList;
                    currentDirectory.files.list[`${folderName[folderName.length - 1]}/`] = {
                        type: 'folder',
                        name: `${folderName[folderName.length - 1]}/`,
                        files: {
                            endOfList: false,
                            list: {}
                        }
                    };
                    directoryFiles.value = currentDirectory.files.list;
                } else {
                    service.value.files.list[dir] = {
                        type: 'folder',
                        name: dir,
                        files: {
                            endOfList: false,
                            list: {}
                        }
                    }
                    directoryFiles.value = service.value.files.list
                }
            } else {
                let name = extractFileName(file.name);
                let subdomain = service.value.subdomain;
                let url = `https://${subdomain}.skapi.com${currentDirectory.value}${name}`;

                if (directory) {
                    let currentDirectory = service.value;
                    for (let i = 1; i < directory.length; i++) {
                        currentDirectory = currentDirectory.files.list[`${directory[i]}/`]
                    }

                    currentDirectory.files.endOfList = files.endOfList;
                    let nameArr = name.split('/');
                    let fileName = nameArr[nameArr.length - 1]

                    currentDirectory.files.list[fileName] = {
                        type: 'file',
                        name: name,
                        url,

                    };
                    directoryFiles.value = currentDirectory.files.list;
                } else {
                    service.value.files.list[name] = {
                        type: 'file',
                        name: name,
                        url,
                    };

                    directoryFiles.value = service.value.files.list;
                }
            }
        }

        isFetching.value = false;
    });
}

getDirectory();

appStyle.background = '#333333';

onBeforeUnmount(() => {
    appStyle.background = null;
});
</script>

<style lang="less" scoped>
@import '@/assets/variables.less';

.overlay-container {
    margin-top: var(--head-space);
}

.actions {
    text-align: right;

    sui-button {
        vertical-align: middle;

        &:not(:last-child) {
            margin-right: 12px;
        }

        &.withIcon {
            padding: 7px 8px;
        }
    }
}

.directoryName {
    display: flex;
    align-items: center;
    margin: 28px 0px 10px;

    svg {
        margin-right: 16px;
        cursor: pointer;
    }

    &>* {
        flex-shrink: 0;
        flex-grow: 0;
    }

    @media @phone {
        margin: 28px 0px 10px;
    }

    .path-wrapper {
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

.filesContainer {
    margin: 10px -20px 0;

    @media @phone {
        margin: 10px -16px 0;
    }

    .fetching {
        text-align: right;
        margin: 10px 20px 0;
        
        @media @phone {
            margin: 10px 16px 0;
        }
    }

    .fileWrapper {
        &:nth-child(even) {
            background: #4a4a4a;
        }
    }
    .file {
        display: flex;
        align-items: center;
        height: 52px;
        padding: 8px 20px;

        &.fade {
            opacity: 0.5;
        }

        .path-wrapper {
            flex-shrink: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            direction: rtl;
            text-align: left;
            cursor: pointer;
            display: inline-block;

            span {
                unicode-bidi: plaintext;
            }
        }

        &>*:not(.path-wrapper) {
            flex-shrink: 0;
            flex-grow: 0;
        }

        a {
            display: inline-block;
            vertical-align: middle;
            width: calc(100% - 32px);
            color: #fff;
            text-decoration: none;
            font-weight: normal;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            direction: rtl;
            text-align: left;
        }

        @media @phone {
            padding: 8px 16px;
        }

        &>sui-input,
        &>svg {
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
</style>