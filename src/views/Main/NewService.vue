<template lang="pug">
NavBarProxy
    template(v-slot:title)
        div Create a New Service
    template(v-slot:rightButton)
        div
.overlay-container(:loading="isDisabled || null")
    form.admin(@submit.prevent="createNewService" action="")
        sui-input(type="text" placeholder="Name of Service" :value="serviceName" @input="(e) => serviceName = e.target.value" required)
        SubmitButton(:loading="isDisabled") Create
</template>
<!-- script below -->
<script setup>
import { inject, ref, onBeforeUnmount } from 'vue';
import { state, skapi } from '@/main';
import { countries, regions } from '@/helper/common';
import { useRouter } from 'vue-router';

import NavBarProxy from '@/components/NavBarProxy.vue';
import Icon from '@/components/Icon.vue';
import SubmitButton from '@/components/SubmitButton.vue';

let router = useRouter();
const emit = defineEmits(['close']);
const isCreatingService = ref(false);
let appStyle = inject('appStyle');
const serviceName = ref('');
const isDisabled = ref(false);

appStyle.navBackground = '#505050';
appStyle.background = '#333333';

onBeforeUnmount(() => {
    appStyle.background = null;
    appStyle.navBackground = '#293fe6';
});

const states = {
    US: {
        OH: {
            lat: 40.367474, 
            long: -82.996216
        },
        VA: {
            lat: 37.926868,
            long: -78.024902
        }
    }
}

const getClosestRegion = () => {
    let currentLocale = skapi.connection.locale;
    let res = '';

    if(regions[skapi.connection.locale]) {
        res = skapi.connection.locale;
    } else {
        let difference = null;
        for (let region in regions) {
            let distance = calculateDistance(countries[currentLocale], countries[region]);
            if(difference == null || distance < difference) {
                difference = distance;
                res = region;
            }
        }
    }
    
    if(res === 'US') {
        let country = res;
        let difference = null;
        for (let state in states[country]) {
            let distance = calculateDistance(states[country][state], countries[currentLocale]);
            if(difference == null || distance < difference) {
                difference = distance;
                res = state;
            }
        }

        return regions[country][res];
    }

    return regions[res];
}
const calculateDistance = (locale, region) => {
    const R = 6371e3; // metres
    const φ1 = (locale.lat * Math.PI) / 180; // φ, λ in radians
    const φ2 = (region.lat * Math.PI) / 180;
    const Δφ = ((region.lat - locale.lat) * Math.PI) / 180;
    const Δλ = ((region.long - locale.long) * Math.PI) / 180;

    const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres

    return d;
}

const createNewService = async() => {
    isDisabled.value = true;
    const serviceLocale = getClosestRegion();
    state.blockingPromise = skapi.createService({region: serviceLocale, name: serviceName.value});
    let res = await state.blockingPromise;
    isDisabled.value = false;
    router.push(`/admin/${res.service}`);
}

</script>

<style lang="less" scoped>
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