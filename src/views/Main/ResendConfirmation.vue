<template lang="pug">
.wrapper
    .container
        h1 Confirm Your Email
        p Please check your inbox at #[span(style="color: var(--primary-color)") {{ email }}] for a confirmation email. Click the link in the email to confirm your email address. 
        p(style="color: var(--primary-color)") Continue to login after confirmation.
        p(style="text-align: left; ") Haven't got any code?
        sui-button.lineButton(type="button" @click="resendSignupConfirmation" :disabled="secondsTillReady || null") 
            template(v-if="secondsTillReady") Email has been sent
            template(v-else) Re-send Confirmation Email
</template>
<script setup>
import { ref } from 'vue';
import { skapi } from '@/main';
import { useRouter } from 'vue-router';

let router = useRouter();
const secondsTillReady = ref(null);

let urlParams = new URLSearchParams(window.location.search);
let email = ref(urlParams.get('email'));

if(urlParams.size && email.value) {
    let uri = window.location.toString();
    if (uri.indexOf("?") > 0) {
        let clean_uri = uri.substring(0, uri.indexOf("?"));
        window.history.replaceState({}, document.title, clean_uri);
    }
}

async function resendSignupConfirmation() {
    if(secondsTillReady.value !== null) return false;

    secondsTillReady.value = 30;
    let countDown = setInterval(() => {
        if(secondsTillReady.value > 0) secondsTillReady.value--;
        else {
            secondsTillReady.value = null;
            clearInterval(countDown);
        }

    }, 1000);
    try {
        await skapi.resendSignupConfirmation('/success');
    } catch(e) {
        console.log({e: e});
        if(e.code === 'INVALID_REQUEST') {
            router.replace('/admin');
        }
    }
}
</script>
<style lang="less" scoped>
@import '@/assets/variables.less';

.container {
    text-align: center;
    margin-top: var(--head-space);

    & > * {
        width: 100%;
    }

    h1 {
        font-size: 32px;
        margin: 0 0 20px 0;
    }

    P {
        margin: 40px auto 8px auto;
        line-height: 1.5;
    }
}
</style>