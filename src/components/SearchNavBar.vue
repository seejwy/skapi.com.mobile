<template lang="pug">
.mobileSearchNav
    slot(name="left")
    div(style="width: 100%;")
        slot
    slot(name="right")
</template>
<script setup>
import { inject, onMounted, onUnmounted } from 'vue';

const appStyle = inject('appStyle');
onMounted(() => {
    appStyle.mainPadding = '0';
})
onUnmounted(() => {
    appStyle.mainPadding = null;
})
</script>
<style lang="less">
@import '@/assets/variables.less';

.mobileSearchNav {
    position: sticky;
    top: 0;
    height: 60px;
    display: flex;
    align-items: center;
    background-color: #333;
    z-index: 1;
    padding: 0 var(--side-padding);

    &::after {
        display: block;
        position: absolute;
        width: 100%;
        left: 0;
        bottom: 0;
        content: '';
        height: 1px;
        background-color: rgba(255 255 255 / 60%);
        box-shadow: 0px 2px 0 0 rgba(0, 0, 0, 0.2);
    }

    .back-button {
        display: inline;
        height: 32px;
        width: 32px;
        color: rgba(255, 255, 255, .4);    
        flex-shrink: 0;
        margin-left: -8px;
    }

    sui-input {
        box-shadow: none !important;
        width: 100%;
        background: transparent !important;
        border: none !important;

        &:focus-within input {
            box-shadow: none !important;
            outline: 0 !important;
        }

        &+span {
            position: absolute;
            right: 8px;
        }
    }

    svg {
        cursor: pointer;
    }
}
</style>