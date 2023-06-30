<template lang="pug">
router-view
Transition(name="toast")
  .toast(v-if="state.user && !state.user.email_verified && state.showVerificationNotification")
      Icon warning_bell
      .title Email Verfication is Needed
      div
      .body Please verify your email to prevent your services from shutting down.
      Icon.close(@click="state.setVerificationDelay") X2
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

import Icon from '@/components/Icon.vue';

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