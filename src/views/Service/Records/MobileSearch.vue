<template lang="pug">
RecordSearch
</template>
<script setup>
import { inject, onBeforeUnmount, onMounted } from 'vue';
import RecordSearch from '@/components/recordSearch.vue';

let appStyle = inject('appStyle');

onMounted(() => {
    appStyle.mainPadding = '0';
    appStyle.background = '#333333';
});

onBeforeUnmount(() => {
    appStyle.mainPadding = null;
    appStyle.background = null;
});
</script>