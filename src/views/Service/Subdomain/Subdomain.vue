<template lang="pug">
NavBarProxy
    template(v-slot:title)
        div(v-if="service.subdomain") Edit Subdomain
        div(v-else) Create Subdomain
    template(v-slot:rightButton)
        div
.overlay-container 
    form.admin(@submit.prevent="saveSubdomain" action="")
        sui-input(type="text" placeholder="Subdomain Name" :value="subdomain" @input="(e) => serviceName = e.target.value" required)
        SubmitButton(v-if="service?.subdomain") Save
        SubmitButton(v-else) Create
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

const saveSubdomain = () => {
    isSaving.value = true;
    skapi.registerSubdomain({
        subdomain: subdomain.value,
        exec: 'register',
        service: service.value.service
    }).then((res) => {
        isSaving.value = false;
        router.replace({name: 'service'})
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
        margin-bottom: 40px;
        width: 100%;

        &[type=submit] {
            display: inline-block;
            width: unset;
        }
    }
}
</style>