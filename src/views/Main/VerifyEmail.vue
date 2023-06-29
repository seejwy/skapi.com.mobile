<template lang="pug">
NavBarProxy
    template(v-slot:leftButton)
        div
form.form.container(@submit.prevent="verifyEmail" action="")
    h2 Verify Email
    p Verification Email has been sent. Please check your email and enter the verification code.
    .input
        label Verification Code
        sui-input(:disabled="promiseRunning" type="text" placeholder="Verification Code" inputmode="numeric" autocomplete="one-time-code" @input="(e) => verificationCode.value = e.target.value" :value="verificationCode.value" required)
    .input
        label Haven't got any code?
        sui-button.lineButton(type="button" @click="resendCode" :disabled="promiseRunning || secondsTillReady")
            template(v-if="secondsTillReady") Code has been sent
            template(v-else) Re-send Code
        .error(v-if="verificationCode.error")
            Icon warning
            span {{ verificationCode.error }}
    .actions
        sui-button.lineButton(type="button" @click="close" :disabled="promiseRunning") Cancel
        SubmitButton(:loading="promiseRunning") Verify
</template>
<!-- script below -->
<script setup>
import { inject, ref, watch, onBeforeUnmount } from 'vue';
import { state, skapi } from '@/main';
import { useRoute, useRouter } from 'vue-router';

import NavBarProxy from '@/components/NavBarProxy.vue';
import Icon from '@/components/Icon.vue';
import SubmitButton from '@/components/SubmitButton.vue';

const router = useRouter();
const route = useRoute();

const verificationCode = ref({
    value: '',
    error: ''
});
const promiseRunning = ref(false);

const verifyEmail = () => {
    verificationCode.value.error = '';
    promiseRunning.value = true;
    skapi.verifyEmail({ code: verificationCode.value.value }).then((res) => {
        state.user.email_verified = true;
        verificationCode.value.value = '';
        verificationCode.value.error = '';

        router.replace('');
    }).catch((e) => {
        console.log({ e: e.code });
        console.log(e.code);
        verificationCode.value.error = 'Verification Failed';
    }).finally(() => {
        promiseRunning.value = false;
    });
}

const secondsTillReady = ref(null);
const resendCode = async () => {
    if (secondsTillReady.value !== null) return false;

    try {
        let countDown = setInterval(() => {
            if (secondsTillReady.value > 0) secondsTillReady.value--;
            else {
                secondsTillReady.value = null;
                clearInterval(countDown);
            }

        }, 1000);
        secondsTillReady.value = 30;

        await skapi.verifyEmail();
    } catch (e) {
        console.log({ e: e });
        if (e.code === 'LimitExceededException') {
            verificationCode.value.error = "Limit exceeded. Please try again later.";
        }
    }
}

const close = () => {
    verificationCode.value.value = '';
    verificationCode.value.error = '';
    router.replace('');
}

onBeforeUnmount(() => {
    router.replace('');
});
</script>
<style lang="less" scoped>
.form.container {
    text-align: center;
    color: #000000d9;
    margin: var(--head-space) auto 0;

    p {
        margin: 40px 0;
        line-height: 1.5;
    }

    .input {
        margin: 20px auto 12px;

        label,
        span {
            display: block;
            text-align: left;
            color: rgba(0, 0, 0, 0.65);
            margin-bottom: 8px;
        }

        label {
            font-weight: bold;
        }

        sui-input {
            width: 100%;
        }

        sui-button {
            width: 100%;
        }

        .error {
            text-align: left;
            margin-top: 4px;

            * {
                display: inline;
                color: #F04E4E;
            }

            span {
                margin-left: 4px;
            }
        }
    }

    .actions {
        margin-top: 40px;
    }

    .stepWrapper {
        margin-top: 56px;

        .step {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #D9D9D9;
            margin-right: 12px;

            &:last-child {
                margin: 0;
            }

            &.active {
                background-color: var(--primary-color);
            }
        }
    }

    &.success {
        svg {
            color: #5AD858;
            width: 56px;
            height: 56px;
        }
    }
}

.lineButton {
    &~sui-button {
        margin-left: 16px;
    }
}
</style>