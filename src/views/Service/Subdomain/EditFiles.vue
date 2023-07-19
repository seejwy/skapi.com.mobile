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
            .fetching(v-if="isFetching && !service?.files?.[service.subdomain+currentDirectory]?.list?.length")
                Icon.animationRotation refresh
            template(v-else-if="service?.files?.[service.subdomain+currentDirectory]?.list?.length")
                template(v-for="(file) in service?.files[service.subdomain+currentDirectory].list")
                    .fileWrapper(v-if="!file.file")
                        .file(:class="{fade: isDeleting && selectedFiles.includes(service.subdomain + currentDirectory + file.name)}")
                            sui-input(type="checkbox" :checked="selectedFiles.includes(service.subdomain + currentDirectory + file.name) || null" @change="checkboxHandler" :value="file.name")
                            Icon folder2
                            .path-wrapper(@click="goto(currentDirectory+=file.name)")
                                span.path {{ file.name }}             
                    .fileWrapper(v-else)
                        .file(:class="{fade: isDeleting && selectedFiles.includes(service.subdomain + currentDirectory + file.name)}")
                            sui-input(type="checkbox" :checked="selectedFiles.includes(service.subdomain + currentDirectory + file.name) || null" @change="checkboxHandler" :value="file.name")
                            Icon file
                            a(:href="`https://${service.subdomain}.skapi.com${currentDirectory}${file.name}`" download).path-wrapper
                                span.path {{ file.name }}
                template(v-if="isFetching")
                    .fileWrapper.animation-skeleton(v-for="i in 10")
            template(v-else)
                div.noFiles
                    div.title No Files
                    p You have not uploaded any files
</template>
<!-- script below -->
<script setup>
import { inject, ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { state, skapi } from '@/main';
import { extractFileName } from '@/helper/files';
import { useRouter, useRoute } from 'vue-router';

import NavBarProxy from '@/components/NavBarProxy.vue';
import LoadingCircle from '@/components/LoadingCircle.vue';
import Icon from '@/components/Icon.vue';
import AddFiles from '@/views/Service/Subdomain/AddFiles.vue';

let router = useRouter();
let route = useRoute();
let appStyle = inject('appStyle');
let service = inject('service');
const errorMessage = ref('');
const selectedFiles = ref([]);
const currentDirectory = ref('/')
const isFetching = ref(false);
const addView = ref(false);
const isDeleting = ref(false);

onMounted(() => {
    window.addEventListener('scroll', mobileScrollHandler, { passive: true });
});

watch(() => route.params, () => {
    if(route.params.folders !== undefined) {
        if(route.params.folders.length) {
            getDirectory(`/${route.params.folders.join('/')}/`);
        } else {
            currentDirectory.value = '';
            getDirectory()
        }
    }

});

const mobileScrollHandler = (e) => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
        getMoreDirectory(currentDirectory.value);
    }
}

const currentDirectoryArray = computed(() => {
    selectedFiles.value = [];
    return currentDirectory.value.split('/').reverse().filter((value) => {
        return value;
    });
})

const goto = (folder) => {
    let newRoute = folder.split('/');
    newRoute.shift();
    newRoute.pop();
    router.push({name: 'files', params: {folders: newRoute}});
}

const jumpto = (index) => {
    router.push({name: 'files', params: {folders: currentDirectoryArray.value.slice(index * -1).reverse()}});
}

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
            const regex = /^.*?\//;
            let result = path.replace(regex, '');
            let pathArray = path.split('/');
            let subdomain = pathArray[0];
            let index;

            if (result[result.length - 1] === '/') {
                index = service.value.files[`${subdomain}${currentDirectory.value}`].list.findIndex((path) => {
                    return path.name === pathArray[pathArray.length - 2] + '/';
                })
            } else {
                index = service.value.files[`${subdomain}${currentDirectory.value}`].list.findIndex((path) => {
                    return path.name === extractFileName(result);
                });
            }

            service.value.files[`${subdomain}${currentDirectory.value}`].list.splice(index, 1);

            if (service.value.files[`${subdomain}${currentDirectory.value}`].list.length <= 0) {
                let oldDirectory = currentDirectory.value;
                let newDirectory = currentDirectory.value.split('/');
                newDirectory.splice(-2);
                currentDirectory.value = newDirectory.join('/') + '/';
                let folderToDelete = oldDirectory.replace(currentDirectory.value, '');
                index = service.value.files[`${subdomain}${currentDirectory.value}`].list.findIndex((path) => {
                    return path.name === folderToDelete;
                });

                service.value.files[`${subdomain}${currentDirectory.value}`].list.splice(index, 1);
            }
        });
        isDeleting.value = false;
        selectedFiles.value = [];
    });

}

const goUpDirectory = () => {
    let newRoute = [...route.params.folders];
    newRoute.pop();
    router.push({name: 'files', params: {folders: newRoute}});
}

const getDirectory = (directory = '/') => {
    currentDirectory.value = directory;
    let findingDirectory = service.value.subdomain + (directory ? directory : '/');
    if (service.value.files?.[findingDirectory]) {
        return service.value.files[findingDirectory];
    }

    let params = {
        service: service.value.service
    }

    if (directory) {
        params.dir = directory;
    }

    isFetching.value = true;

    skapi.listHostDirectory(params).then((files) => {
        if(files.list.length === 0 && route.params.folders.length) {
            isFetching.value = false;
            router.push({name: 'files', params: {folders: []}});
            return;
        }
        if (!service.value.hasOwnProperty('files')) {
            service.value.files = {}
        }
        if (!service.value.files[`${service.value.subdomain}${currentDirectory.value}`]) {
            service.value.files[`${service.value.subdomain}${currentDirectory.value}`] = {
                endOfList: files.endOfList,
                list: []
            };
        }

        files.list.forEach((file) => {
            let filename = extractFileName(file.name);

            if (file.type === 'folder') {
                service.value.files[`${service.value.subdomain}${currentDirectory.value}`].list.push({
                    name: filename,
                    type: 'folder'
                })
            } else {
                service.value.files[`${service.value.subdomain}${currentDirectory.value}`].list.push({
                    type: 'file',
                    file,
                    name: filename
                })
            }
        })


        isFetching.value = false;
    });
}

const getMoreDirectory = (directory) => {
    let findingDirectory = service.value.subdomain + (directory ? directory : '/');
    if(isFetching.value || service.value.files[findingDirectory].endOfList) return false;

    let params = {
        service: service.value.service
    }

    if (directory) {
        params.dir = directory;
    }

    isFetching.value = true;

    skapi.listHostDirectory(params, {fetchMore: true}).then((files) => {
        if (!service.value.hasOwnProperty('files')) {
            service.value.files = {}
        }

        files.list.forEach((file) => {
            let filename = extractFileName(file.name);
            if (file.type === 'folder') {
                service.value.files[`${service.value.subdomain}${currentDirectory.value}`].list.push({
                    name: filename,
                    type: 'folder'
                })
            } else {
                service.value.files[`${service.value.subdomain}${currentDirectory.value}`].list.push({
                    type: 'file',
                    file,
                    name: filename
                })
            }
        });

        isFetching.value = false;
    });
}

if(route.params.folders) {
    getDirectory('/'+route.params.folders.join('/') + '/');
} else {
    getDirectory();
}

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
        &.animation-skeleton {
            height: 52px;
        }

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