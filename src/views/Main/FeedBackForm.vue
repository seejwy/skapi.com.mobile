<template lang="pug">
NavBarProxy
    template(v-slot:title)
        div Feedback
    template(v-slot:rightButton)
        div
.wrapper(:loading="promiseRunning || null")
    .container(:loading="promiseRunning || null")
        template(v-if="step === 1")
            form(@submit.prevent="inputStar")
                p Before you proceed, help us improve skapi with your feedback.
                p How would you rate skapi on a scale of 1 to 5?
                .starWrap
                    label.starBox
                        input(type="radio" name="star")
                        span.starImg
                    label.starBox
                        input(type="radio" name="star")
                        span.starImg
                    label.starBox
                        input(type="radio" name="star")
                        span.starImg
                    label.starBox
                        input(type="radio" name="star")
                        span.starImg
                    label.starBox
                        input(type="radio" name="star")
                        span.starImg
                br
                SubmitButton(:loading="promiseRunning") Continue
        template(v-else-if="step === 2")
            form(@submit.prevent="inputFeedback")
                p 
                    | In your opinion, what improvements could be 
                    br
                    | made to enhance the skapi experience?
                .input
                    label Enter Your Feedback
                    sui-textarea(
                        type="text"
                        :value="feedback"
                        style="width: 100%; min-height: 100px;"
                        @input="(e) => { feedback = e.target.value;}"
                        placeholder="Enter your feedback"
                        required)
                SubmitButton(:loading="promiseRunning") Submit
        template(v-else)
            Icon.success check_circle
            h1 Thank you!
            p Thanks for taking the time to share your thoughts.
            sui-button(type="button" @click="router.push('?new=service')") Continue

        .navigator(v-if="step <= 2")
            .ball(v-for="num in 2" @click="() => { num < step ? step = num : null; password = '';  passwordConfirm = '';}" :class="{'active': step === num}")
</template>

<script setup>
import { inject, ref, onBeforeUnmount } from 'vue';
import { skapi, state } from '@/main';
import { useRouter } from 'vue-router';

import NavBarProxy from '@/components/NavBarProxy.vue';
import Icon from '@/components/Icon.vue';
import SubmitButton from '@/components/SubmitButton.vue';

let appStyle = inject('appStyle');

let router = useRouter();
const promiseRunning = ref(false);
let feedback = ref('');
let step = ref(1);
let idx = 0;

const inputStar = () => {
    promiseRunning.value = true;

    let starWrapChild = document.querySelector('.starWrap').children;
    let starWrapChildArr = Array.from(starWrapChild);
    let checkedStar = document.querySelector('input[name="star"]:checked').parentNode;

    checkedStar.classList.add('checked');

    for (let i = 0; i < starWrapChildArr.length; i++) {
        if (starWrapChildArr[i].classList.contains('checked')) {
            idx = i + 1;
        }
    }

    step.value++;
    promiseRunning.value = false;
}

const inputFeedback = () => {
    promiseRunning.value = true;

    skapi.postRecord({feedback : feedback.value},{table : {name: 'feedBackForm', access_group: 99}, index: {name: 'star', value: idx}}).then(() => {
        skapi.updateProfile({misc:'feedback complete'});
    }).catch(e => {
        console.log({e});
    }).finally(() => {
        step.value++;
        promiseRunning.value = false;
    });    
}
</script>

<style lang="less" scoped>
@import '@/assets/variables.less';

.wrapper {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    min-height: calc(100vh - 140px);
}

.container {
    text-align: center;
    width: 100%;
    box-shadow: none;
    border: none;
    background: #FFF;
    padding: 0;
    margin-top: var(--head-space);

    &>*:not(sui-button) {
        width: 100%;
    }

    sui-button[type=submit] {
        margin-top: 40px;
    }

    sui-button {
        min-width: 140px;

        &+a {
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

    .starWrap {
        display: inline-block;
        overflow: hidden;
        height: 51px;

        &:after {
            content: "";
            display: block;
            position: relative;
            z-index: 10;
            height: 51px;
            background-image: url('/assets/img/icons/star-mobile.svg');
            background-size: contain;
            pointer-events: none;
        }

        .starBox {
            position: relative;
            z-index: 1;
            float: left;
            width: 51px;
            height: 51px;
            cursor: pointer;

            input {
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
                position: absolute !important;

                &:checked+.starImg {
                    background-color: #293FE6;
                }
            }
        }

        .starImg {
            display: block;
            position: absolute;
            right: 0;
            width: 500px;
            height: 51px;
            pointer-events: none;
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
            }

            &:last-child {
                margin: 0;
            }
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

        &+sui-button[type=submit] {
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
</style>