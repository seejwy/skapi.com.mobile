<template lang="pug">
router-view
</template>

<script setup>
import { provide, ref } from 'vue';
provide('searchResult', ref(null));
</script>