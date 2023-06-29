<template lang="pug">
router-view
</template>

<script setup>
import { provide, ref } from 'vue';

provide('searchResult', ref(null));
provide('recordToOpen', ref(null));
</script>

<style lang="less">
@import '@/assets/variables.less';

.view-record-overlay {
    border: 1px solid #808080;
    box-shadow: 4px 4px 12px rgba(0, 0, 0, 0.25);
    border-radius: 8px;
    width: 500px;
    max-width: 100%;
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
}

.close-record-overlay {
    position: absolute;
    right: -16px;
    top: -16px;
    z-index: 1;
    background-color: #D9D9D9;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: #434343;
    cursor: pointer;

    svg {
        user-select: none;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
}
</style>