<template lang="pug">
.wrapper
    .container
        Icon check_circle
        h1 Congratulations!
        p Your email has been confirmed. #[br] You can now login to Skapi.
        sui-button(type="button" @click="router.push('/admin')") Login
</template>
<script setup>
import { inject } from 'vue';
import { skapi, state } from '@/main';
import { useRouter } from 'vue-router';

import Icon from '@/components/Icon.vue';

let router = useRouter();

</script>
<style lang="less" scoped>
@import '@/assets/variables.less';
.container {
    text-align: center;
    margin-top: var(--head-space);
    
    sui-button {
        min-width: 140px;
    }

    h1 {
        font-size: 32px;
        margin: 20px 0 40px 0;
    }

    p {
        margin: 40px auto;
        line-height: 1.5;
    }

    svg {
        height: 56px;
        width: 56px;
        color: #5AD858;
    }
}
</style>