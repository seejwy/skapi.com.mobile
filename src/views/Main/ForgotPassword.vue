<template lang="pug">
.wrapper(:loading="promiseRunning || null")
    .container(:loading="promiseRunning || null")
        template(v-if="step === 1")
            form(@submit.prevent="forgotPassword")
                h1 Forgot Password
                p Please enter the email address you ‘d like your password reset information sent to
                .input
                    label Enter your Email
                    sui-input(
                        type="text" 
                        placeholder="E.g. someone@gmail.com"
                        :value="email"
                        @input="(e) => { email = e.target.value; e.target.setCustomValidity(''); }"
                        inputmode="email"
                        @change="validateEmail"
                        required)
                .error(v-if="forgotError") {{ forgotError }}
                SubmitButton(:loading="promiseRunning") Continue
                RouterLink(to="/admin") Back to Login
        template(v-else-if="step === 2")
            form(@submit.prevent="changePassword")
                h1 New Password
                p(style="color: var(--primary-color)") Please check your email and insert the code in order to create a new password.
                p The code has been sent to : {{email}}
                .input
                    label Code
                    sui-input(
                        type="text"
                        :value="code"
                        @input="(e) => { code = e.target.value; resetError = null; }"
                        placeholder="Enter verification code"
                        autocomplete="one-time-code"
                        inputmode="numeric"
                        required)
                .input
                    span Haven't got any code?
                    sui-button.lineButton(type="button" @click="resendForgotPassword" :disabled="(secondsTillReady || forgotError || isRequestingCode) || null") 
                        template(v-if="forgotError") {{ forgotError }}
                        template(v-else-if="isRequestingCode") 
                            LoadingCircle(style="--bgColor: 250, 250, 250; --ringColor: 0, 0, 0;")
                        template(v-else-if="secondsTillReady") Code has been sent
                        span(:style="{color: 'var(--primary-color)', margin: 0, visibility: !forgotError && !isRequestingCode && !secondsTillReady ? 'visible' : 'hidden', position:  !forgotError && !secondsTillReady ? 'relative' : 'absolute'}") Resend Code
                .input
                    label New Password
                    PasswordInput(
                        ref="passwordField"
                        @input="e=> { password = e.target.value; e.target.setCustomValidity(''); }" 
                        :value='password' 
                        @change="validatePassword"
                        autocomplete="new-password"
                        :required="true")
                .input
                    label Retype New Password
                    PasswordInput(
                        ref="confirmPasswordField"
                        @input="e=> { passwordConfirm = e.target.value; e.target.setCustomValidity(''); }" 
                        :value='passwordConfirm' 
                        @change="validatePassword" 
                        autocomplete="new-password"
                        :required="true")
                .error(v-if="resetError") {{ resetError }}
                SubmitButton(:loading="promiseRunning") Change Password
        template(v-else)
            Icon.success check_circle
            h1 New Password Success
            p Your password has been changed successfully. Please login with new password.
            sui-button(type="button" @click="router.push('/admin')") Login

        .navigator(v-if="step <= 2")
            .ball(v-for="num in 2" @click="() => { num < step ? step = num : null; password = '';  passwordConfirm = '';}" :class="{'active': step === num}")

</template>
<script setup>
import { inject, ref, onBeforeMount } from 'vue';
import { skapi, state } from '@/main';
import { useRouter } from 'vue-router';

import Icon from '@/components/Icon.vue';
import SubmitButton from '@/components/SubmitButton.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import LoadingCircle from '@/components/LoadingCircle.vue';

let router = useRouter();
let email = ref('');
let code = ref('');
let password = ref('');
let passwordConfirm = ref('');
let forgotError = ref(null);
let resetError = ref(null);
const secondsTillReady = ref(null);
const isRequestingCode = ref(false);
const promiseRunning = ref(false);
const passwordField = ref(null);
const confirmPasswordField = ref(null);

let step = ref(1);

onBeforeMount(async() => {
    await skapi.getConnection().then(() => {
        if(state.user) router.push({name: 'admin'});
    })
});

const validateEmail = (event) => {
    if(skapi.validate.email(event.target.value)) {
		event.target.setCustomValidity('');
    } else {
		event.target.setCustomValidity('Invalid Email');
		event.target.reportValidity();
    }
}

const validatePassword = () => {
    if(password.value.length < 6 || password.value.length > 60) {
		passwordField.value.setError('Invalid Password');
    } else if(passwordConfirm.value !== password.value) {
        confirmPasswordField.value.setError('Password does not match');
    } else {
		passwordField.value.clearError();
        confirmPasswordField.value.clearError();
    }
}

const forgotPassword = () => {
    if(promiseRunning.value) return false;
    promiseRunning.value = true;
    code.value = '';
    password.value = '';
    passwordConfirm.value = '';
    forgotError.value = null;
    
    skapi.forgotPassword({email: email.value}).then(res => {
        step.value++;
    }).catch(e => {
        console.log({e:e.code});
        if(e.code === 'LimitExceededException') {
            forgotError.value = "You have exceeded the number of tries. Please try again later.";
        }
    }).finally(() => {    
        promiseRunning.value = false;
    });
}

const resendForgotPassword = async () => {
    if(secondsTillReady.value !== null || forgotError.value !== null) return false;
    forgotError.value = null;

    try {
        isRequestingCode.value = true;
        await skapi.forgotPassword({email: email.value})
        isRequestingCode.value = false;

        secondsTillReady.value = 30;
        let countDown = setInterval(() => {
            if(secondsTillReady.value > 0) secondsTillReady.value--;
            else {
                secondsTillReady.value = null;
                clearInterval(countDown);
            }

        }, 1000);
    } catch(e) {
        console.log({e:e.code});
        if(e.code === 'LimitExceededException') {
            forgotError.value = "Limit exceeded. Please try again later.";
        }
    }
}

const changePassword = () => {
    promiseRunning.value = true;
    skapi.resetPassword({ email: email.value, code: code.value, new_password: password.value }).then(() => {    
        step.value++;
    }).catch(e => {
        console.log({e:e.code});
        if(e.code === 'LimitExceededException') {
            resetError.value = "You have exceeded the number of tries. Please try again later."
        } else if(e.code === 'CodeMismatchException') {
            resetError.value = "Verification code is incorrect."
        }
    }).finally(() => {
        promiseRunning.value = false;
    });
}

</script>
<style lang="less" scoped>
.container {
    text-align: center;
    margin-top: var(--head-space);

    & > *:not(sui-button) {
        width: 100%;
    }

    sui-button[type=submit] {
        margin-top: 40px;
    }

    sui-button {
        min-width: 140px;

        & + a {
            margin-top: 20px;
            display: block;
        }
    }

    h1 {
        font-size: 32px;
        margin: 0 0 40px 0;
    }

    p {
        margin: 20px auto;
        line-height: 1.5;

        &:first-of-type {
            margin-top: 40px;
        }
        &:last-of-type {
            margin-bottom: 40px;
        }
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
    }
    .action {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;

        label {
            cursor: pointer;

            sui-input {
                vertical-align: middle;
                margin-right: 4px;
            }

            span {
                vertical-align: middle;
                color: rgba(0, 0, 0, 0.65);
            }
        }

        a {
            font-weight: normal;
        }
    }

    .error {
        text-align: left;
        color: #F04E4E;
        margin-bottom: 27px;

        svg {
            margin-right: 4px;
        }

        & + sui-button[type=submit] {
            margin-top: 0;
        }
    }

    a {
        color: #293FE6;
        text-decoration: none;
        font-weight: bold;
    }

    .lineButton {
        display: block;
    }
}
.success {
    color: #5AD858;
    margin-bottom: 20px;
    width: 56px;
    height: 56px;
}

.navigator {
    margin-top: 56px;
    .ball {
        display: inline-block;
        height: 12px;
        width: 12px;
        border-radius: 50%;
        background-color: #D9D9D9;
        cursor: pointer;
        margin-right: 12px;

        &.active {        
            background-color: var(--primary-color);
            
            & ~ .ball {        
                cursor: default;
            }
        }

        &:last-child {
            margin: 0;
        }
    }
}
</style>