<template lang="pug">
NavBarProxy
    template(v-slot:title)
        div Edit Subdomain
    template(v-slot:rightButton)
        div
.overlay-container(:loading="isSaving || null") 
    form.admin(@submit.prevent="save404" action="")
        .subdomain
            .title Subdomain
            .value {{ service.subdomain }}
        label
            div 404 File
            sui-input(type="text" placeholder="Enter path eg. /404.html" :value="errorFile" @input="(e) => errorFile = e.target.value")
            .error {{ errorMessage }}
        SubmitButton(:loading="isSaving") Save
</template>
<!-- script below -->
<script setup>
import { inject, ref, reactive, onBeforeUnmount, computed, watch } from 'vue';
import { state, skapi } from '@/main';
import { useRouter } from 'vue-router';

import NavBarProxy from '@/components/NavBarProxy.vue';
import LoadingCircle from '@/components/LoadingCircle.vue';
import SubmitButton from '@/components/SubmitButton.vue';
import Icon from '@/components/Icon.vue';

let router = useRouter();
let appStyle = inject('appStyle');
let service = inject('service');
const isSaving = ref(false);
const errorFile = ref(service.value[404]);
const errorMessage = ref('');

if (!service.value.subdomain) {
    router.replace({ name: 'service' })
}

watch(() => service.value[404], () => {
    errorFile.value = service.value[404];
});

const save404 = () => {
    errorMessage.value = '';
    isSaving.value = true;
    let filePath = service.value.subdomain + '/' + errorFile.value;
    if (!errorFile.value) {
        filePath = null;
    }

    skapi.set404(service.value.service, filePath).then((res) => {
        if(service.value[404]) {
            skapi.deleteHostFile({
                keys: [service.value.subdomain + '/.cfacdb7c8270a90aba6011585793dfc3/'],
                service: service.value.service
            });
        }
        if(filePath) {
            const blob = new Blob([errorFile.value], { type: 'text/plain' });
            const file = new File([blob], '.cfacdb7c8270a90aba6011585793dfc3');

            let formData = new FormData();
            formData.append('.cfacdb7c8270a90aba6011585793dfc3/'+errorFile.value, file, '.cfacdb7c8270a90aba6011585793dfc3/'+errorFile.value);
            
            skapi.uploadFiles(formData, {
                service: service.value.service,
                request: 'host',
                progress: (e) => {
                    if(e.progress === 100) {                 
                        service.value[404] = errorFile.value;
                        isSaving.value = false;
                        router.replace({name: 'service'});
                    }
                }
            });
        } else {
            delete service.value[404];
            isSaving.value = false;
            router.replace({name: 'service'});
        }
    }).catch((err) => {
        console.log(err);
        isSaving.value = false;
        errorMessage.value = "File does not exist!"
        throw err;
    })
}

appStyle.background = '#333333';

onBeforeUnmount(() => {
    appStyle.background = null;
});
</script>

<style lang="less" scoped>
@import '@/assets/variables.less';

.overlay-container {
    color: #fff;
    text-align: center;
    margin-top: var(--head-space);

    sui-input {
        display: block;
        width: 100%;

        &[type=submit] {
            display: inline-block;
            width: unset;
        }
    }

    .admin>*:nth-last-child(2) {
        margin-bottom: 40px;
    }

    label {
        display: block;
        text-align: left;
        font-weight: bold;

        &>div {
            margin-bottom: 8px;
        }

        .suggestion {
            position: relative;
            margin-top: 8px;

            &Box {
                position: absolute;
                z-index: 1;
                font-weight: normal;
                padding: 9.6px;
                background-color: #434343;
                width: 100%;
                border-radius: 4px;

                &>div:not(:last-child) {
                    margin-bottom: 8px;
                    height: 36px;
                }
            }
        }
    }

    .subdomain {
        text-align: left;
        margin-bottom: 16px;

        .title {
            font-weight: bold;
            margin-bottom: 8px;
        }

        .value {
            font-style: italic;
            opacity: 0.5;
        }
    }
    .error {
        font-weight: normal;
        margin-top: 4px;
        text-align: left;
        color: #f04e4e;
    }
}
</style>