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
                div {{ currentDirectoryArray }}
                span.path(v-for="(folder, index) in currentDirectoryArray" @click="jumpto(currentDirectoryArray.length - index)")
                    span {{ folder }}/
                span /
        .filesContainer        
            div {{ service.files }}
            pre {{ service.subdomain}} {{ currentDirectory }}
            .fetching(v-if="isFetching")
                Icon.animationRotation refresh
            template(v-else-if="Object.keys(service?.files).length")
                template(v-for="(file) in service?.files[service.subdomain+currentDirectory]")
                    .fileWrapper(v-if="!file.file")
                        .file(:class="{fade: isDeleting && selectedFiles.includes(service.subdomain + currentDirectory + file.name)}")
                            sui-input(type="checkbox" :checked="selectedFiles.includes(service.subdomain + currentDirectory + file.name) || null" @change="checkboxHandler" :value="file.name")
                            Icon folder2
                            .path-wrapper(@click="getDirectory(currentDirectory+=file.name)")
                                span.path {{ file.name }}             
                    .fileWrapper(v-else)
                        .file(:class="{fade: isDeleting && selectedFiles.includes(service.subdomain + currentDirectory + file.name)}")
                            sui-input(type="checkbox" :checked="selectedFiles.includes(service.subdomain + currentDirectory + file.name) || null" @change="checkboxHandler" :value="file.name")
                            Icon file
                            a(:href="file.url" download).path-wrapper
                                span.path {{ file.name }}
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

const jumpto = (index) => {
    getDirectory(`/${currentDirectoryArray.value.slice(index * -1).reverse().join('/')}/`);
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
    let directoryArray = [...currentDirectoryArray.value];
    directoryArray.reverse();
    directoryArray.pop();
    let newDirectory = `/${directoryArray.join('/')}/`;

    currentDirectory.value = newDirectory;

    if(directoryArray.length) {
        getDirectory(newDirectory);
    } else {
        getDirectory();
    }
}

const getDirectory = (directory) => {
    console.log({directory: service.value.subdomain + directory});
    console.log(service.value.files)
    if(service.value.files?.[service.value.subdomain + directory]) {
        return service.value.files[service.value.subdomain + directory];
    }

    let params = {
        service: service.value.service
    }

    if (directory) {
        params.dir = directory;
    }

    isFetching.value = true;

    skapi.listHostDirectory(params).then((files) => {
        if (!service.value.hasOwnProperty('files')) {
            service.value.files = {}
        }
        if (!service.value.files[`${service.value.subdomain}${currentDirectory.value}`]) {
            service.value.files[`${service.value.subdomain}${currentDirectory.value}`] = [];     
        }

        files.list.forEach((file) => {
            let filename = extractFileName(file.name);

            if(file.type === 'folder') {
                service.value.files[`${service.value.subdomain}${currentDirectory.value}`].push({
                    name: filename
                }) 
            } else {
                service.value.files[`${service.value.subdomain}${currentDirectory.value}`].push({
                    file,
                    url: `https://${service.value.subdomain}.skapi.com${currentDirectory.value}${filename}`,
                    name: filename
                }) 
            }
        })


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