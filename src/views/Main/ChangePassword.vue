<template lang="pug">
NavBarProxy
    template(v-slot:leftButton)
        div
.form.container(v-if="processStep < 2" :loading="promiseRunning || null")
    h2 Change Password
    template(v-if="processStep === 0")
        form(@submit.prevent="verifyPassword" action="")
            p Please enter your current password.
            input(type="email" autocomplete="username" :value="state.user.email" style="position: absolute; visibility: hidden; opacity: 0")
            .input
                label Current Password
                PasswordInput(
                    ref="currentPasswordField"
                    @input="(e) => { password.current.value = e.target.value; e.target.setCustomValidity(''); password.current.error = ''}" 
                    :value="password.current.value"
                    @change="validatePassword"
                    autocomplete="current-password"
                    :required="true")
                .error(v-if="password.current.error")
                    Icon warning
                    span {{ password.current.error }}
            .actions
                sui-button.lineButton(type="button" @click="closePasswordChange") Cancel
                SubmitButton(type="submit" :loading="promiseRunning") Continue
            .stepWrapper
                .step.active
                .step
    template(v-else-if="processStep === 1")
        form(@submit.prevent="changePassword" action="")
            p Please enter your new password.
            input(type="email" autocomplete="username" :value="state.user.email" style="position: absolute; visibility: hidden; opacity: 0")
            .input
                label New Password
                PasswordInput(
                    ref="newPasswordField"
                    @input="(e) => { password.new.value = e.target.value; e.target.setCustomValidity(''); }" 
                    :value="password.new.value" 
                    @change="validatePassword"
                    autocomplete="new-password"
                    :required="true")
            .input
                label New Password Confirm
                PasswordInput(
                    ref="newPasswordConfirmField"
                    @input="(e) => { password.confirm.value = e.target.value; e.target.setCustomValidity(''); }" 
                    :value="password.confirm.value" 
                    @change="validatePassword"
                    autocomplete="confirm-password"
                    :required="true")
                .error(v-if="password.confirm.error")
                    Icon warning
                    span {{ password.confirm.error }}
            .actions
                sui-button.lineButton(type="button" @click="closePasswordChange") Cancel
                SubmitButton(:loading="promiseRunning") Change Password
            .stepWrapper
                .step.clickable(@click="processStep = 0")
                .step.active
.form.container.success(v-else)
    Icon check_circle
    h2 Password Change Success
    p Your password has been changed successfully. Please login with new password.
    .actions
        sui-button(type="button" @click="logout") Login
</template>
<!-- script below -->
<script setup>
import { inject, ref, watch, onBeforeUnmount } from 'vue';
import { state, skapi } from '@/main';
import { useRoute, useRouter } from 'vue-router';

import NavBarProxy from '@/components/NavBarProxy.vue';
import Icon from '@/components/Icon.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import SubmitButton from '@/components/SubmitButton.vue';

const router = useRouter();
const route = useRoute();

const emit = defineEmits(['close']);
const processStep = ref(0);
const currentPasswordField = ref(null);
const newPasswordField = ref(null);
const newPasswordConfirmField = ref(null);
const password = ref({
    current: {
        value: '',
        error: ''
    },
    new: {
        value: ''
    },
    confirm: {
        value: '',
        error: ''
    }
});

const promiseRunning = ref(false);

const closePasswordChange = () => {
    router.replace('');
    processStep.value = 0;
    password.value.current.value = '';
    password.value.confirm.value = '';
    password.value.new.value = '';
    password.value.current.error = '';
    password.value.confirm.error = '';
}

const validatePassword = () => {
    if(processStep.value === 0) {
        if(password.value.current.value.length < 6 || password.value.current.value.length > 60) {
            currentPasswordField.value.setError('Password is incorrect');
        }
    } else {
        if(password.value.new.value.length < 6 || password.value.new.value.length > 60) {
            newPasswordField.value.setError('Min 6 characters and Max 60 characters');
        } else if(password.value.new.value !== password.value.confirm.value) {
            newPasswordConfirmField.value.setError('Password does not match');
        } else {
            if(currentPasswordField.value) currentPasswordField.value.clearError();
            if(newPasswordConfirmField.value) newPasswordConfirmField.value.clearError();
        }
    }
}

const verifyPassword = async () => {
    promiseRunning.value = true;
    password.value.current.error = '';

    try {
        await skapi.login({email: state.user.email, password: password.value.current.value}, {logout: false});
        processStep.value = 1;
    } catch(e) {
        console.log({e: e.code});
        if(e.code === 'INCORRECT_USERNAME_OR_PASSWORD') {
            password.value.current.error = 'Current password is incorrect';
        } else if(e.code === 'LimitExceededException') {
            password.value.current.error = 'Your password change limit has exceeded. Verify your password again later.';
        }
    } finally {
        promiseRunning.value = false;
    }
}

const changePassword = async () => {
    promiseRunning.value = true;
    password.value.confirm.error = '';

    if(password.value.new.value !== password.value.confirm.value) {
        password.value.confirm.error = 'Your password does not match';    
        promiseRunning.value = false;
        return false;
    }

    try {
        await skapi.changePassword({
            current_password: password.value.current.value,
            new_password: password.value.new.value
        });

        processStep.value = 2;
    } catch(e) {
        console.log({e: e.code});
        if(e.code === 'LimitExceededException') {
            password.value.confirm.error = 'Your password change limit has exceeded.';
        }
    } finally {    
        promiseRunning.value = false;
    }
}

const logout = async () => {
    await router.push('admin');
    skapi.AdminLogout().then(() => {
        state.user = null;
    });
}

onBeforeUnmount(() => {
    router.replace('');
});
</script>

<style lang="less" scoped>
@import '@/assets/variables.less';

.form.container {
    text-align: center;
    color: #000000d9;
    width: 542px;
    max-width: 100%;
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
    & ~ sui-button {
        margin-left: 16px;
    }
}
</style>