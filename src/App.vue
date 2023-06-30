<template lang="pug">
router-view
</template>

<style lang="less" scoped>
#app {
  width: 100%;
  height: 100%;
}
</style>
<!-- script below -->
<script setup>
import { provide, ref } from 'vue';
import { state } from '@/main';
import { useRoute } from 'vue-router';

let pageTitle = ref('skapi');
const route = useRoute();
provide('pageTitle', pageTitle);
provide('navbarMobileRightButton', ref(null));
provide('navbarBackDestination', ref(null));

provide('appStyle', {
  get background() {
    return document.body.style.getPropertyValue('--app-bg-color');
  },
  set background(v) {
    document.body.style.setProperty('--app-bg-color', v);
  },
  get color() {
    return document.body.style.getPropertyValue('--app-color');
  },
  set color(v) {
    document.body.style.setProperty('--app-color', v);
  },
  get navBackground() {
    return document.body.style.getPropertyValue('--app-nav-bg-color');
  },
  set navBackground(v) {
    document.body.style.setProperty('--app-nav-bg-color', v);
  },
  get mainPadding() {
    return document.getElementById('appMain').style.padding;
  },
  set mainPadding(v) {
    document.getElementById('appMain').style.padding = v;
    if(v) {
      document.getElementById('appMain').style.paddingBottom = '80px';
    }
  }
});

</script>