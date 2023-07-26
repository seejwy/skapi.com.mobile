<template lang="pug">
div(v-if='!state?.connection')
    // is loading...
ChangePassword(v-if="state?.user && route.query.page === 'password'")
VerifyEmail(v-else-if="state?.user && route.query.page === 'verify'")
DeleteAccount(v-else-if="state?.user && route.query.page === 'delete'")
div(v-else-if="state?.user" :loading="isSaving || null")
    .pageHeader.headSpaceHelper
        h1.fixed Account Settings
    .settings-wrapper
        form.settings(@submit.prevent="updateUserSettings" @keydown.enter.prevent="" action="")
            hr
            .title Name
            .value
                sui-input(v-if="isEdit" type="text" @input="(e) => settings.name = e.target.value" :value="settings.name")
                span(v-else) {{  state.user.name }}
            hr
            .title(style="margin-bottom: 0;") Email
            .actions(v-if="!state.user.email_verified" @click="openVerifyEmail")
                span Verify Email
            .value           
                sui-input(
                    v-if="isEdit" 
                    type="text" 
                    :value="settings.email" 
                    @input="(e)=> { settings.email = e.target.value; e.target.setCustomValidity(''); }" 
                    @change="validateEmail"
                    inputmode="email")
                template(v-else)
                    span {{  state.user.email }}
                    .email-status(:class="{'unverified': !state.user.email_verified ? true : null, 'verified': state.user.email_verified ? true : null}")
                        Icon warning
                        span(v-if="state.user.email_verified") Verified
                        span(v-else) Unverified
            hr   
            .title Newsletter Subscription
            .value
                template(v-if="isEdit")
                    label
                        sui-input(type="checkbox" :disabled="state.user.email_verified ? null : true" :checked="settings.email_subscription ? true : null" @change="(e) => settings.email_subscription = e.target.checked")
                        span I agree to receive information and news letters from Skapi via Email.
                template(v-else)
                    template(v-if="settings.email_subscription === ''") -
                    template(v-else-if="settings.email_subscription") Subscribed
                    template(v-else) Not Subscribed
                .actions(v-if="settings.email_subscription.isEdit")
                    span.cancel(@click="settings.email_subscription.isEdit = false") Cancel
                    span.save(@click="settings.email_subscription.isEdit = false") Save
            hr
            .title(style="margin-bottom: 0;") Password
            .actions
                span(@click="() => { if(isSaving) return false; router.replace('?page=password')}") Change Password
            hr
            .submit
                template(v-if="isEdit")
                    sui-button.lineButton(type="button" @click="cancelEdit") Cancel
                    SubmitButton(:loading="isSaving") Save
                sui-button(v-else type="button" @click="isEdit = true") Edit Account

    .settings-wrapper.delete     
        hr
        div(@click="openDeletePopup") Delete Your Account
            Icon(style="height: 20px; width: 20px; margin-left: 8px;") trash
</template>
<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { state, awaitConnection } from '@/main';
import { useRoute, useRouter } from 'vue-router';

import Icon from '@/components/Icon.vue';
import SubmitButton from '@/components/SubmitButton.vue';
import PasswordInput from '@/components/PasswordInput.vue';
import ChangePassword from '@/views/Main/ChangePassword.vue';
import VerifyEmail from '@/views/Main/VerifyEmail.vue';
import DeleteAccount from '@/views/Main/DeleteAccount.vue';

import { skapi } from '@/main';

let router = useRouter();
let route = useRoute();

const isEdit = ref(false);
const isDelete = ref(false);
let settings = ref({
    email_subscription: '',
    name: '',
    email: ''
});

const isSaving = ref(false);

const openDeletePopup = async () => {
    if (isSaving.value) return false;

    isDelete.value = true;
    await nextTick();
    router.replace('?page=delete');
};

const openVerifyEmail = async () => {
    skapi.verifyEmail().catch(err => console.log(err));
    router.replace('?page=verify');

};

const cancelEdit = () => {
    isEdit.value = false;
    settings.value.name = state.user.name;
    settings.value.email = state.user.email;
    settings.value.email_subscription = state.user.email_subscription;
};

const validateEmail = (event) => {
    if (skapi.validate.email(event.target.value)) {
        event.target.setCustomValidity('');
    } else {
        event.target.setCustomValidity('Invalid Email');
        event.target.reportValidity();
    }
};

const updateUserSettings = async () => {
    if (state.user.name === settings.value.name && state.user.email === settings.value.email && state.user.email_subscription === settings.value.email_subscription) {
        isEdit.value = false;
        isSaving.value = false;
        return true;
    }

    try {
        isSaving.value = true;
        let isSubscribe = settings.value.email !== state.user.email ? false : settings.value.email_subscription;
        let res = await skapi.updateProfile({
            name: settings.value.name,
            email: settings.value.email
        });

        if(!isSubscribe) settings.value.email_subscription = false;
        if (state.user.email_subscription !== isSubscribe) {
            if (isSubscribe) {
                await skapi.subscribeNewsletter({ group: 1 });
                settings.value.email_subscription = true;
            } else {
                await skapi.unsubscribeNewsletter({ group: 1 });
                settings.value.email_subscription = false;
            }
        }

        state.user = res;
        if (!res.email_verified) state.showVerificationNotification = true;

    } catch (e) {
        console.log({ e });
        settings.value.name = state.user.name;
        settings.value.email = state.user.email;
        settings.value.email_subscription = state.user.email_subscription;
    } finally {
        isEdit.value = false;
        isSaving.value = false;
    }
};

const deleteAccount = async () => {
    let res = await skapi.postRecord(null, {
        table: {
            name: 'reason'
        },
        index: {
            name: 'NR',
            value: true
        }
    });
};

onMounted(() => {
    awaitConnection.then(async () => {
        if (state.user) {
            if (!state.user.hasOwnProperty('email_subscription')) {
                let subscriptions = await skapi.getNewsletterSubscription();
                state.user.email_subscription = subscriptions.length && subscriptions[0].group === 1 ? true : false;
                settings.value.email_subscription = subscriptions.length && subscriptions[0].group === 1 ? true : false;
            } else {
                settings.value.email_subscription = state.user.email_subscription;
            }
            settings.value.name = state.user.name;
            settings.value.email = state.user.email;
        }
    });
});
</script>
    
<style lang="less" scoped>
@import '@/assets/variables.less';

.pageHeader {
    text-align: center;
    margin-bottom: 12px;

    h1 {
        display: block;
    }
}

.settings-wrapper {
    margin: 0 -20px;

    @media @phone {
        margin: 0 -16px;
    }

    &.delete {
        line-height: 52px;
        margin-top: 24px;
        padding: 0 16px;
        user-select: none;
        font-weight: bold;
        color: rgba(0, 0, 0, 0.65);

        &> {
            cursor: pointer;
        }
    }
}

.settings {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    padding: 0 20px;
    
    @media @phone {
        padding: 0 16px;
    }
    
    &>.title {
        height: auto;
        font-weight: bold;
        color: rgba(0, 0, 0, .65);
        white-space: nowrap;
        
        .actions {
            display: block;
        }
    }
    
    .value {
        grid-column: span 2;
        margin-top: 8px;

        &>span {
            display: inline-block;
            margin-top: 20px;
            margin-right: 8px;
        }
    }

    .email-status {
        display: inline-block;

        span {
            vertical-align: middle;
        }

        svg {
            margin-right: 4px;
        }

        &.verified {
            color: #5AD858;
        }

        &.unverified {
            color: #FF8D3B;
        }
    }

    .actions {
        justify-self: end;
        color: var(--primary-color);
        font-weight: bold;
        cursor: pointer;
        white-space: nowrap;

        .save,
        .cancel {
            display: inline-block;
            font-weight: bold;
        }

        .cancel {
            margin-right: 28px;
            color: #F04E4E;
        }
    }

    .value {
        grid-column: span 2;

        label {
            display: flex;
            gap: 7px;

            sui-input {
                flex-shrink: 0;
                margin-top: calc((1.5em - 16px) / 2);
            }

            span {
                line-height: 1.5;
            }
        }

        .actions {
            text-align: right;
            margin-top: 28px;
        }

        &>sui-input {
            width: 100%;
        }
    }

    .submit {
        grid-column: span 2;
        grid-row: span 2;
        justify-self: center;
        padding-top: 28px;
    }
}

.settings-wrapper {
    hr {
        border: 1px solid rgba(0, 0, 0, 0.04);
        box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.06);
        width: 100vw;
        grid-column: span 2;
        margin: 28px -20px;
        
        @media @phone {
            margin: 28px -16px;
        }
    }
}

.delete hr {
    margin: 80px -16px 28px;
}

.lineButton {
    &~sui-button {
        margin-left: 16px;
    }
}
</style>
    