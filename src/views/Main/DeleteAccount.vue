<template lang="pug">
NavBarProxy
    template(v-slot:leftButton)
        div
.form.container(v-if="processStep < 3" :loading="promiseRunning || null")
    Icon(style="height: 32px; width: 32px; fill: #F04E4E;") warning
    h2(style="color: #F04E4E;") Delete Your Account
    template(v-if="processStep === 0")
        form
            p(style="margin-bottom: 28px;") Are you sure you want to delete your account permanently?
            hr
            div(style="text-align: left;")
                p(style="font-weight: bold;") Warning : this cannot be undone.
                label
                    sui-input(type="checkbox" :checked="form.confirm" @change="(e) => { form.confirm = e.target.checked ? true : false; form.confirm ? form.error = false : form.error = true; }")
                    span I acknowledge that: 
                ul
                    li All my services will be permanently deleted
                    li All my information will be permanently deleted
                .error(v-if="form.error") You must acknowledge the this in order to proceed
            .actions
                sui-button(type="button" @click="close") No, keep my account
                sui-button.textButton(type="button" style="margin-top: 24px;" @click="() => { form.confirm ? processStep = 1 : form.error = true}") Yes, delete my account
            .stepWrapper
                .step.active
                .step
                .step
    template(v-else-if="processStep === 1")
        form
            p Before you disable your account, can you tell us why you’re leaving?
            hr
            .questions
                label
                    sui-input(type="checkbox" value="notUseful" @change="toggleReason") 
                    span I don’t find it useful
                label
                    sui-input(type="checkbox" value="hardToUnderstand" @change="toggleReason") 
                    span I don’t understand how it works
                label
                    sui-input(type="checkbox" value="hardToUse" @change="toggleReason") 
                    span It’s not easy to use
                label
                    sui-input(type="checkbox" value="securityConcerns" @change="toggleReason") 
                    span I have safety concerns
                .input
                    label Please list any other reasons why you might be leaving : 
                    sui-input(
                        @input="(e) => { form.reasonText = e.target.value; }" 
                        :value="form.reasonText")
            .actions
                sui-button.lineButton(type="button" @click="close") Cancel
                sui-button(type="button" @click="processStep = 2") Continue
            .stepWrapper
                .step.clickable(@click="goto(0)")
                .step.active
                .step
    template(v-else-if="processStep === 2")
        form(@submit.prevent="deleteAccount" action="")
            p In order to delete the account, Please enter password.
            hr
            .questions
                .input
                    label Enter your password to confirm delete.
                    PasswordInput(
                        @input="(e) => { form.password = e.target.value; }"
                        :value="form.password"
                        :required="true")
                    .error(v-if="form.error") {{ form.error }}
            .actions
                sui-button.lineButton(type="button" @click="close") Cancel
                SubmitButton(:loading="promiseRunning") Delete
            .stepWrapper
                .step.clickable(@click="goto(0)")
                .step.clickable(@click="goto(1)")
                .step.active
</template>
<!-- script below -->
<script setup>
import { ref, onBeforeUnmount, onMounted } from 'vue';
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
const form = ref({
    confirm: false,
    reason: [],
    reasonText: '',
    password: '',
    error: ''
});

const promiseRunning = ref(false);

const close = () => {
    if(promiseRunning.value) return false;
    router.replace('');
}

const goto = (step) => {
    if(promiseRunning.value) return false;
    
    if(step <= 0) {
        form.value.confirm = false;
    }

    if(step <= 1) {
        form.value.reason = [];
        form.value.reasonText = [];
    }

    if(step <= 2) {
        form.value.password = '';
        form.value.error = '';
    }

    processStep.value = step;
}

const toggleReason = (e) => {
    if(form.value.reason.includes(e.target.value)) {
        let idx = form.value.reason.findIndex(val => {
            return val === e.target.value;
        });

        form.value.reason.splice(idx, 1);
    } else {
        form.value.reason.push(e.target.value);
    }
}

const deleteAccount = async (e) => {
    promiseRunning.value = true;
    if(form.value.password.length < 6 || form.value.password.length > 60) {
        form.value.error = "Password is incorrect";
        promiseRunning.value = false;
        return false;
    }
    try {
        await skapi.login({email: state.user.email, password: form.value.password}, {logout: false});
        
        let reasonPromiseArray = [];
        form.value.reason.forEach((reason) => {
            reasonPromiseArray.push(skapi.postRecord(null, {
                table: {
                    name: 'reason',
                    access_group: 99
                }, 
                index: {
                    name: reason,
                    value: true
                }
            }));
        });

        if(form.value.reasonText) {
            reasonPromiseArray.push(skapi.postRecord(null,{
                table: {
                    name: 'reason',
                    access_group: 99
                }, 
                index: {
                    name: 'OTHER',
                    value: form.value.reasonText
                }
            }));
        }

        try {        
            await Promise.all(reasonPromiseArray);
            await skapi.disableAccount();
            state.services = null;
            await router.push('/deleted');
            state.user = null;
        } catch(e) {
            throw e;
        }
    } catch(e) {
        console.log({e}, e.code);
        switch(e.code) {
            case 'INCORRECT_USERNAME_OR_PASSWORD':
                form.value.error = "Password is incorrect";
                break;
            case 'ERROR':
                form.value.error = "Something went wrong. Please try again later";
                break;
        }
    } finally {
        promiseRunning.value = false;
    }
}

onMounted(() => {    
    processStep.value = 0;
});

onBeforeUnmount(() => {
    router.replace('');
});
</script>

<style lang="less" scoped>
.form.container {
    text-align: center;
    color: #000000d9;
    margin: var(--head-space) auto 0;
    
    h2 {
        margin: 40px;
    }

    p {
        margin: 24px 0;
        line-height: 1.5;
    }

    .input {
        margin: 16px auto 12px;

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
    }
    .error {
        margin-top: 4px;      
        color: #F04E4E;
    }
    sui-input[type=checkbox] {
        vertical-align: middle;

        & ~ span {
            vertical-align: middle;
            display: inline-block;
            margin-left: 12px;
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
}

.textButton {
    padding: 0;
    display: block;
    &:hover,
    &:focus,
    &:active {
        background-color: transparent !important;
        box-shadow: none !important;
    }
}

.lineButton {
    & ~ sui-button {
        margin-left: 16px;
    }
}

hr {
    margin: 28px -40px;
    border: 1px solid rgba(0, 0, 0, 0.04);
    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.06);
}

ul {
    li {
        margin-bottom: 8px;
    }
}
.questions {
    text-align: left;

    & > label {
        display: block;
        margin-bottom: 8px;
        cursor: pointer;
    }
}
</style>