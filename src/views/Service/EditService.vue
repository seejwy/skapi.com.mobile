<template lang="pug">
NavBarProxy
    template(v-slot:title)
        div Service Setting
    template(v-slot:rightButton)
        div(style="position: relative; width: 28px; height: 28px;" v-if="isDisabled")
            LoadingCircle(style="--bgColor: 80, 80, 80; --ringColor: 250, 250, 250;")
        span(v-else @click="save" style="font-weight: bold; cursor: pointer") Save
.overlay-container(v-if="service" :loading="isDisabled || null")
    form(@submit.prevent="save" @keydown.enter.prevent="" action="")
        .toggle(style="margin-bottom: 40px")
            span Enable/Disable
            .toggleBar 
                .toggleBall(@click="toggle" :class="{'active': serviceStatus > 0 }")
        .input
            label Name of Service
            sui-input(type="text" placeholder="Name of Service" :value="serviceName" @input="(e) => serviceName = e.target.value" required)
        .input
            label CORS
            sui-input(type="text" :value="cors" @input="(e) => cors = e.target.value" required @change="validateCors")
        .input(style="margin-bottom: 40px;")
            label API Key
            sui-input(type="text" :value="apiKey" @input="(e) => apiKey = e.target.value")
sui-overlay(ref="disableConfirmOverlay")
    .popup
        .title
            Icon warning
            div(v-if="service?.active > 0") Disabling Service?
            div(v-else) Enabling Service?
        .body 
            p(v-if="service?.active > 0") Your service will go offline if you disable "{{ service.name }}"? #[br] Do you wish to continue?
            p(v-else) Your service will be resumed if you enable "{{ service.name }}"? #[br] Do you wish to continue?
        .foot
            sui-button.textButton(type="button" @click="rejectDisable") No 
            sui-button.textButton(type="button" @click="confirmDisable") Yes
sui-overlay(ref="disableErrorOverlay")
    .popup
        .title
            Icon warning
            div Something went wrong!
        .body {{ errorMessage }}
        .foot
            sui-button.lineButton(type="button" @click="()=> { disableErrorOverlay.close(); }") Ok
</template>
<!-- script below -->
<script setup>
import { inject, ref, watch, onBeforeUnmount } from 'vue';
import { state, skapi } from '@/main';
import { useRouter } from 'vue-router';

import NavBarProxy from '@/components/NavBarProxy.vue';
import LoadingCircle from '@/components/LoadingCircle.vue';
import Icon from '@/components/Icon.vue';

let router = useRouter();
let appStyle = inject('appStyle');
let service = inject('service');
let navbarMobileRightButton = inject('navbarMobileRightButton');
let isDisabled = ref(false);
const serviceStatus = ref(0);
const serviceName = ref('');
const cors = ref('');
const apiKey = ref('');
const disableConfirmOverlay = ref(null);
const errorMessage = ref('');
const disableErrorOverlay = ref(null);

serviceName.value = service.value.name;
cors.value = service.value.cors;
apiKey.value = service.value.api_key;
serviceStatus.value = service.value.active;

const validateCors = (event) => {
    let isValid = true;
    cors.value.split(',').forEach(url => {
        if(!skapi.validate.url(url.trim())) {
            isValid = false;
        }
    });

    if(isValid) {
        event.target.setCustomValidity('');
    } else {
        event.target.setCustomValidity('Invalid CORS');
        event.target.reportValidity();
    }
}

let rejectDisable = () => {
    disableConfirmOverlay.value.close();
    isDisabled.value = false;
}

let confirmDisable = () => {
    state.blockingPromise = new Promise(async res => {
        disableConfirmOverlay.value.close();
        let oldStatus = service.value.active === 0 ? 0 : 1;
    
        try {
            if(service.value.active > 0) {
                service.value.active = 0;
                await skapi.disableService(service.value.service);
            } else {
                service.value.active = 1;
                await skapi.enableService(service.value.service);
            }
            await saveFunction();
        } catch(e) {
            service.value.active = oldStatus;
            errorMessage.value = "Unable to toggle service status at this point.";
            disableErrorOverlay.value.open();
            console.error(e);
        }

        isDisabled.value = false;
        res();
    });
}

const save = async () => {
    if(
        service.value.active === serviceStatus.value &&
        service.value.name === serviceName.value &&
        service.value.cors === cors.value &&
        service.value.api_key === apiKey.value
    ) {
        router.replace({query: null});
        return;
    }

    isDisabled.value = true;
    
    if(serviceStatus.value !== service.value.active) {
        disableConfirmOverlay.value.open();
        return;
    } else {
        state.blockingPromise = await saveFunction();
    }
}

const saveFunction = async () => {
    let res;
    try {
        res = await skapi.updateService(service.value.service, {
            name: serviceName.value,
            cors: cors.value,
            api_key: apiKey.value
        });
        
        service.value.name = serviceName.value;
        service.value.cors = cors.value;
        service.value.api_key = apiKey.value;
    } finally {
        isDisabled.value = false;
    }
        
    router.replace({query: null});
    
    return res;
}

const toggle = () => {
    if(isDisabled.value) return;
    serviceStatus.value > 0 ? serviceStatus.value = 0 : serviceStatus.value = 1;
}

appStyle.background = '#333333';

onBeforeUnmount(() => {
    appStyle.background = null;
});
</script>

<style lang="less" scoped>
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
}
.toggle {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: bold;
    color: rgba(255, 255, 255, .6);

    &Bar {
        position: relative;
        height: 8px;
        width: 40px;
        background: rgba(0, 0, 0, 0.6);
        border: 0.3px solid #595959;
        box-shadow: inset 0.5px 0.5px 1px rgba(0, 0, 0, 0.25);
        border-radius: 2px;
        margin-right: 10px;
    }
    &Ball {
        position: absolute;
        cursor: pointer;
        height: 20px;
        width: 20px;
        left: -10px;
        top: -7px;
        border-radius: 10px;
        background: #D9D9D9;
        border: 0.3px solid #595959;
        box-shadow: 0.5px 0.5px 1px rgba(0, 0, 0, 0.25), inset -0.5px -0.5px 1px rgba(0, 0, 0, 0.25), inset 1px 1px 1px #FFFFFF;
        transition: left .3s ease-in-out, background-color .3s ease-in-out;

        &.active {
            left: calc(100% - 10px);
            background: #5AD858;
        }
    }
}
.delete-button {
    padding: 0;
    margin-top: 4px;
    color: rgba(255, 255, 255, 0.85);

    &:hover {
        background-color: transparent;
    }
}

hr {
    opacity: 8%;
}
</style>