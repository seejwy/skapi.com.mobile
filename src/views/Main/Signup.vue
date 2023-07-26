<template lang="pug">
.wrapper(:loading="promiseRunning || null")
    .container
        template(v-if="step === 1")
            form(@submit.prevent="step++")
                h1 Signup
                .input
                    label Email
                    sui-input(
                        type="text"
                        inputmode="email"
                        @change="validateEmail" 
                        :value='form.email' 
                        @input="e=> { form.email = e.target.value; e.target.setCustomValidity(''); error = '' }" 
                        placeholder="E.g. someone@gmail.com" 
                        required)
                .input
                    label Name
                    sui-input(type="text" :value='form.username' @input="e=>form.username = e.target.value" placeholder="Enter your name" autocomplete="given-name")
                .input
                    label Password            
                    PasswordInput(ref="passwordField" @input="e=> { form.password = e.target.value; e.target.setCustomValidity(''); }" :value='form.password' @change="validatePassword" placeholder="Create a password" :required="true" autocomplete="new-password")
                .input
                    label Password Confirm
                    PasswordInput(ref="confirmPasswordField" @input="e=> { form.password_confirm = e.target.value; e.target.setCustomValidity(''); }" :value='form.password_confirm' @change="validatePassword" placeholder="Retype your password" :required="true" autocomplete="new-password")
                .error(v-if="error")
                    Icon warning
                    span {{ error }}
                .input.checkbox
                    Label 
                        sui-input(
                            type="checkbox" 
                            @input="(e)=> form.subscribe = e.target.checked"
                            :checked="form.subscribe ? true : null")
                        span I agree to receive information and news letters from Skapi via Email.
                SubmitButton(:disabled="error || null") Continue
        template(v-if="step >= 2")
            form(@submit.prevent="signup" action="")
                h1 Tell Us More
                .input 
                    label What is your role?
                        sui-select(required @change="(e) => form.misc.role = e.target.value")
                            option(disabled :selected="form.misc.role === ''" value) -- Please select one --
                            option(value="frontend" :selected="form.misc.role === 'frontend'") Frontend Engineer
                            option(value="backend" :selected="form.misc.role === 'backend'") Backend Engineer
                            option(value="fullstack" :selected="form.misc.role === 'fullstack'") Fullstack Engineer
                            option(value="others" :selected="form.misc.role === 'others'") None of the above
                .input 
                    label How many years of experience do you have in dev?
                        sui-select(required @change="(e) => form.misc.experience = e.target.value")
                            option(disabled :selected="form.misc.experience === ''" value) -- Please select one --
                            option(value="1" :selected="form.misc.experience === '1'") Less than a year
                            option(value="5" :selected="form.misc.experience === '5'") 1 to 5 years
                            option(value="10" :selected="form.misc.experience === '10'") 5 to 10 years
                            option(value="100" :selected="form.misc.experience === '100'") More than 10 years
                .input.checkbox.multi
                    .question You are looking for:
                    label Database Solutions
                        sui-input(type="checkbox" value="database" :checked="form.misc.feature.includes('database') || null" @change="() => { questionsError.feature = false; checkboxSelectionHandler('database', form.misc.feature) }")

                    label Cloud Storage
                        sui-input(type="checkbox" value="cloud storage" :checked="form.misc.feature.includes('cloud storage') || null" @change="() => { questionsError.feature = false; checkboxSelectionHandler('cloud storage', form.misc.feature)}")

                    label Authentication
                        sui-input(type="checkbox" value="authentication" :checked="form.misc.feature.includes('authentication') || null" @change="() => { questionsError.feature = false; checkboxSelectionHandler('authentication', form.misc.feature)}")
                    .error(v-if="questionsError.feature") Please select at least one
                .input.checkbox.multi
                    .question What will you use skapi for?
                    label Hobby / Learning
                        sui-input(type="checkbox" value="hobby and learning" :checked="form.misc.purpose.includes('hobby and learning') || null" @change="() => { questionsError.purpose = false; checkboxSelectionHandler('hobby and learning', form.misc.purpose)}")

                    label Personal projects
                        sui-input(type="checkbox" value="personal projects" :checked="form.misc.purpose.includes('personal projects') || null" @change="() => { questionsError.purpose = false; checkboxSelectionHandler('personal projects', form.misc.purpose)}")

                    label Company projects
                        sui-input(type="checkbox" value="company" :checked="form.misc.purpose.includes('company') || null" @change="() => { questionsError.purpose = false; checkboxSelectionHandler('company', form.misc.purpose)}")
                    .error(v-if="questionsError.purpose") Please select at least one
                SubmitButton(:loading="promiseRunning") Create Account
                .error(v-if="error")
                    Icon warning
                    span {{ error }}
                //- .terms By signing up, you’re agree to our #[RouterLink(to="/") Terms & Conditions] #[span and ] #[RouterLink(to="/") Privacy Policy]
        div Already have an account?&nbsp;
            RouterLink(to="/admin") Login
        .navigator
            .ball(v-for="num in 2" @click="() => { num < step ? step = num : null; password = '';  passwordConfirm = '';}" :class="{'active': step === num}")

</template>
<script setup>
import { watch, reactive, ref, onBeforeMount } from 'vue';
import { skapi, state } from '@/main';
import { useRoute, useRouter } from 'vue-router';

import Icon from '@/components/Icon.vue';
import SubmitButton from '@/components/SubmitButton.vue';
import PasswordInput from '@/components/PasswordInput.vue';

let route = useRoute();
let router = useRouter();
const error = ref(null);
let questionsError = ref({
    feature: false,
    purpose: false
})
const page = ref('signup');
let step = ref(1);
const secondsTillReady = ref(null);
const promiseRunning = ref(false);
const passwordField = ref(null);
const confirmPasswordField = ref(null);

onBeforeMount(async () => {
    await skapi.getConnection().then(() => {
        if (state.user) router.push({ name: 'admin' });
    })
});

let form = reactive({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    subscribe: true,
    misc: {
        role: '',
        feature: [],
        experience: '',
        purpose: []
    }
});

watch(() => state.user, u => {
    if (u && route.name === 'login') {
        router.replace('/admin');
    }
});

const checkboxSelectionHandler = (value, arr) => {
    if (arr.includes(value)) {
        let idx = arr.indexOf(value)
        arr.splice(idx, 1);
    } else {
        arr.push(value)
    }
}

const validateEmail = (event) => {
    if (skapi.validate.email(event.target.value)) {
        event.target.setCustomValidity('');
    } else {
        event.target.setCustomValidity('Invalid Email');
        event.target.reportValidity();
    }
}

const validatePassword = () => {
    if (form.password.length < 6 || form.password.length > 60) {
        passwordField.value.setError('Min 6 characters and Max 60 characters');
    } else if (form.password_confirm !== form.password) {
        confirmPasswordField.value.setError('Password does not match');
    } else {
        passwordField.value.clearError();
        confirmPasswordField.value.clearError();
    }
}

function signup() {
    if (!form.misc.feature.length || !form.misc.purpose.length) {
        !form.misc.feature.length ? questionsError.value.feature = true : false;
        !form.misc.purpose.length ? questionsError.value.purpose = true : false;

        return false
    }
    error.value = '';
    promiseRunning.value = true;
    let options = {
        signup_confirmation: '/success',
    }

    if (form.subscribe) {
        options.email_subscription = form.subscribe;
    }

    form.misc.experience = Number(form.misc.experience)

    skapi.signup({ email: form.email, password: form.password, name: form.username, misc: JSON.stringify(form.misc) }, options).then(result => {
        router.push({ path: '/confirmation', query: { email: form.email } })
    }).catch(e => {
        console.log({ e });
        promiseRunning.value = false;

        switch (e.code) {
            case 'INVALID_PARAMETER':
                error.value = 'Email or password is invalid';
                step.value = 1;
                break;
            case 'EXISTS':
                error.value = "This email is already in use";
                step.value = 1;
                break;
            default:
                error.value = "Something went wrong please contact an administrator.";
                throw e;
        }
    });
}

</script>
<style lang="less" scoped>
.container {
    text-align: center;
    margin-top: var(--head-space);

    h1 {
        font-size: 32px;
        margin: 0 0 36px 0;
    }

    .question {
        text-align: left;
        font-weight: bold;
        margin-bottom: 20px;
    }

    .input {
        text-align: left;
        color: rgba(0, 0, 0, 0.65);
        margin-top: 28px;

        &.checkbox label,
        &.radio label {
            display: flex;
            cursor: pointer;
            gap: 8px;

            sui-input {
                margin: 1px 0 0 0;
                flex-grow: 0;
                flex-shrink: 0;
            }
        }

        &.checkbox.multi label {
            margin-bottom: 16px;
            flex-direction: row-reverse;
            justify-content: flex-end;
        }

        &:not(.radio):not(.checkbox) {
            label {
                display: block;
                font-weight: bold;
                margin-bottom: 8px;

                sui-select {
                    margin-top: 8px;
                    font-weight: normal;
                }
            }

            sui-input,
            sui-select {
                width: 100%;
                margin-left: 0;
            }
        }

        &:not(.checkbox) {
            margin: 20px auto 12px;
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
        margin: 20px auto;

        svg {
            margin-right: 4px;
        }

        &+sui-input[type=submit] {
            margin-top: 0;
        }
    }

    sui-button[type=submit] {
        margin: 40px 0 24px;
    }

    a {
        color: #293FE6;
        text-decoration: none;
        font-weight: bold;
    }
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
}</style>