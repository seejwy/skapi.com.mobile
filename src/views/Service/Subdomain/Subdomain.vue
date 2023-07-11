<template lang="pug">
NavBarProxy
    template(v-slot:title)
        div Create Subdomain
    template(v-slot:rightButton)
        div
.overlay-container(:loading="isSaving || null") 
    form.admin(@submit.prevent="saveSubdomain" action="")
        sui-input(type="text" placeholder="Subdomain Name" :value="subdomain" @input="(e) => subdomain = e.target.value" required)
        .error {{ errorMessage }}
        SubmitButton(:loading="isSaving") Create
</template>
<!-- script below -->
<script setup>
import { inject, ref, reactive, onBeforeUnmount, computed } from 'vue';
import { state, skapi } from '@/main';
import { useRouter } from 'vue-router';

import NavBarProxy from '@/components/NavBarProxy.vue';
import LoadingCircle from '@/components/LoadingCircle.vue';
import SubmitButton from '@/components/SubmitButton.vue';
import Icon from '@/components/Icon.vue';

let router = useRouter();
let appStyle = inject('appStyle');
let service = inject('service');
const subdomain = ref(service.value.subdomain);
const isSaving = ref(false);
const errorMessage = ref('');

if(service.value.subdomain) {
    router.replace({name: 'service'})
}

const saveSubdomain = () => {
    isSaving.value = true;
    skapi.registerSubdomain({
        subdomain: subdomain.value,
        exec: 'register',
        service: service.value.service
    }).then((res) => {
        skapi.getServices(service.value.service).then((res) => {
            state.services = res;
            service.value = res[service.value.region].find(serv => serv.service === service.value.service);

            router.replace({name: 'service'})
        })
    }).catch((e) => {
        console.log({e});
        errorMessage.value = 'This subdomain has already been taken.';

    }).finally(() => {
        isSaving.value = false;
    });
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

    .error {
        color: #f04e4e;
    }
}
</style>