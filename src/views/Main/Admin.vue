<template lang="pug">
div(v-if='!state?.connection')
    // is loading...
NewService(v-else-if="state?.user && route.query.new === 'service'")
FeedBackForm(v-else-if="state?.user && route.query.new === 'feedback'")
div(v-else-if="state?.user")
    .pageHeader.headSpaceHelper
        h1.fixed Admin
        p.
            You can see a list of all the services you are running.
            To create a new service, click on "New Service".

        .action
            sui-button.with-icon(type="button" @click="NewServiceConditions" :disabled="!state.user.email_verified || null")
                Icon plus2
                span New Service
    .container(v-if="serviceList?.length")
        template(v-for="service in serviceList")
            router-link.service(:to='"/admin/" + service.service')
                .settings
                    .name 
                        .indicator(:class="{'active': service.active > 0}")
                        span {{ service.name }}
                    Icon right
    .container.empty(v-else-if="state.blockingPromise")
        Icon.animationRotation(style="position: absolute; right: 24px; top: 24px; fill: var(--primary-color)") refresh
    .container.empty.noService(v-else)
        div(style="position: absolute; width: 100%;")
            .title No Services
            span Get started by creating a new service.
    Transition(name="toast")
        .toast(v-if="state.user && !state.user.email_verified && state.showVerificationNotification")
            Icon warning_bell
            .title Email Verfication is Needed
            div
            .body Please verify your email to prevent your services from shutting down.
            Icon.close(@click="state.setVerificationDelay") X2
</template>
<script setup>
import { ref, watch } from 'vue';
import { state, skapi } from '@/main';
import { dateFormat, localeName } from '@/helper/common';
import { useRoute, useRouter } from 'vue-router';

import NewService from '@/views/Main/NewService.vue';
import FeedBackForm from '@/views/Main/FeedBackForm.vue';
import Icon from '@/components/Icon.vue';

let router = useRouter();
let route = useRoute();

let serviceList = ref(null);
state.blockingPromise = true;

const NewServiceConditions = async () => {
    await getServices(state.getServices, serviceList);

    skapi.getProfile().then((r) => {
        if (r.misc === 'feedback complete') {
            if (state.user.email_verified) {
                router.push('?new=service');
            } else {
                return null;
            }
        } else {
            let services = skapi.services;
            let services_count = Object.keys(services).length;
            let users_count = 0;

            if (services_count > 0) {
                let value = services[Object.keys(services)[0]];

                for (let i = 0; i < value.length; i++) {
                    let users = value[i].users;
                    users_count += users;
                }

                if (users_count > 0) {
                    if (state.user.email_verified) {
                        router.push('?new=feedback');
                    } else {
                        return null;
                    }
                } else {
                    if (state.user.email_verified) {
                        router.push('?new=service');
                    } else {
                        return null;
                    }
                }
            } else {
                if (state.user.email_verified) {
                    router.push('?new=service');
                } else {
                    return null;
                }
            }
        }
    })
}

async function getServices(gs) {
    if (!(gs instanceof Promise) || !state.user) {
        return;
    }

    try {
        let services = await gs;
        state.blockingPromise = false;
        if (serviceList.value === null) {
            serviceList.value = [];
            for (let region in services) {
                serviceList.value = [...serviceList.value, ...services[region]];
            }

            serviceList.value.sort((a, b) => a.timestamp > b.timestamp ? -1 : a.timestamp < b.timestamp ? 1 : 0);
        }

        return services;

    } catch (err) {
        serviceList.value = null;
        throw err;
    }
}
getServices(state.getServices);
// watch is for users visiting the page directly
watch(() => state.getServices, getServices);
</script>
        
<style lang="less" scoped>
.container {
    &.empty {
        position: relative;
        display: inline-flex;
        width: 100%;
        align-items: center;
        justify-content: center;
        background: #F5F5F5;
        border-radius: 8px;
        text-align: center;

        .title {
            font-size: 28px;
            font-weight: bold;
            color: rgba(0, 0, 0, 0.6);
            margin-bottom: 12px;
        }

        &,
        &.noService {
            height: 123.33px;

            .title {            
                font-size: 20px;
            }

            span {            
                opacity: .25;
            }
        }
    }

    .service {
        display: block;
        background: #595959;
        padding: 24px;
        border-radius: 8px;
        color: unset;
        text-decoration: unset;

        &:hover {
            background: #595959;
        }

        &:not(:last-child) {
            margin-bottom: 24px;
        }

        .settings {
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 32px;
        }

        .name span {
            margin-left: 12px;
            color: #fff;
            font-size: 20px;
            vertical-align: middle;
        }
    }
}

.indicator {
    position: relative;
    display: inline-block;
    vertical-align: middle;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #D9D9D9;
    border: 0.3px solid #595959;
    box-shadow: inset -1px -1px 2px rgba(0, 0, 0, 0.25), inset 1px 1px 2px rgba(255, 255, 255, 0.65);

    &.active {
        background: #5AD858;
    }
}
</style>
        