<template lang="pug">    
NavBarProxy
    template(v-slot:title)
        div Mail
.pageHeader.headSpaceHelper
    p.
        You can access all your trigger emails here. Trigger emails can be used to send newsletters to your users and also change the default templates for emails sent to your users.
.container
    .titleActionsWrapper
        .titleWrapper
            Icon mail
            h2 Newsletter Trigger Emails
        .actions
    .innerContainer
        .emailGrid
            .emailGridItem            
                .name 
                    span Public Newsletter (Group 0)
                    button(@click="copyToClipboard(service?.newsletter_triggers?.[0])")
                        Icon copy
                .value
                    template(v-if="service?.newsletter_triggers?.[0]") {{service?.newsletter_triggers?.[0]}}
                    template(v-else) Loading...

            .emailGridItem
                .name 
                    span Users Newsletter (Group 1)
                    button(@click="copyToClipboard(service?.newsletter_triggers?.[1])") 
                        Icon copy
                .value
                    template(v-if="service?.newsletter_triggers?.[1]") {{service?.newsletter_triggers?.[1]}}
                    template(v-else) Loading...
.container
    .titleActionsWrapper
        .titleWrapper
            Icon mail
            h2 Basic Trigger Emails
        .actions
    .innerContainer
        .emailGrid
            .emailGridItem            
                .name 
                    span Welcome Email
                    button(@click="copyToClipboard(service?.email_triggers.template_setters.welcome)") 
                        Icon copy
                .value {{service?.email_triggers.template_setters.welcome}}

            .emailGridItem
                .name 
                    span Newsletter Subscription
                    button(@click="copyToClipboard(service?.email_triggers.template_setters.newsletter_subscription)") 
                        Icon copy
                .value {{service?.email_triggers.template_setters.newsletter_subscription}}

            .emailGridItem
                .name 
                    span Email Verification
                    button(@click="copyToClipboard(service?.email_triggers.template_setters.verification)") 
                        Icon copy
                .value {{service?.email_triggers.template_setters.verification}}

            .emailGridItem
                .name 
                    span Signup Confirmation
                    button(@click="copyToClipboard(service?.email_triggers.template_setters.signup_confirmation)") 
                        Icon copy
                .value {{service?.email_triggers.template_setters.signup_confirmation}}
</template>
<script setup>
import { inject, onMounted } from 'vue';
import { skapi } from '@/main';

import Icon from '@/components/Icon.vue';
import NavBarProxy from '@/components/NavBarProxy.vue';

let service = inject('service');

onMounted(() => {
    if (!service.value.hasOwnProperty('newsletter_triggers')) {
        service.value.newsletter_triggers = [];
        Promise.all([
            skapi.requestNewsletterSender(service.value.service, 0),
            skapi.requestNewsletterSender(service.value.service, 1)
        ]).then(results => {
            service.value.newsletter_triggers = results;
        })
    }
})

const copyToClipboard = (email) => {
    let button = document.activeElement;

    try {
        return navigator.clipboard.writeText(email)
    } catch {
        let doc = document.createElement('textarea')
        doc.value = email;
        doc.setAttribute("readonly", "");
        doc.style.contain = "strict";
        doc.style.position = "absolute";
        doc.style.left = "-9999px";
        doc.style.fontSize = "12pt";
        document.body.append(doc);
        doc.select();
        document.execCommand('copy');
        doc.remove();
    } finally {
        button.classList.add('copied');
        setTimeout(() => {
            button.classList.remove('copied');
        }, 1000);
    }
}
</script>
<style lang="less" scoped>
.container {
    margin: 40px 0 0;
    border-radius: 0;

    .innerContainer {
        padding: 20px;
        background: #434343;
        border-radius: 12px;

        .titleActionsWrapper {
            margin-bottom: 32px;

            h2 {
                font-size: 20px;
                font-weight: normal;
            }
        }

        &.services {
            padding: 0;
            background-color: transparent;
        }
    }

    h2,
    p {
        color: rgba(255, 255, 255, .85);
        margin: 0;
    }

    h2 {
        display: inline-block;
        vertical-align: middle;
        font-size: 24px;
        margin-bottom: 28px;
        font-weight: bold;
    }

    p {
        color: rgba(255, 255, 255, .85);
        line-height: 1.5;
    }

    .titleActionsWrapper {
        display: flex;
        justify-content: space-between;
        margin-bottom: 16px;

        h2 {
            font-size: 20px;
            font-weight: normal;
        }
    }

    .titleWrapper {
        h2 {
            margin: 0;
        }

        svg {
            margin-right: 8px;
        }
    }

    .actions {
        cursor: pointer;
        user-select: none;

        svg {
            margin-right: 4px;
        }

        span {
            vertical-align: middle;
        }

        &.disabled {
            opacity: 0.4;
        }
    }

    &:first-child {
        margin-top: 0;
    }

    &:last-child {
        margin-bottom: 0;
    }
}

.emailGrid {
    &Item {
        position: relative;
        width: 100%;
        background-color: rgba(255, 255, 255, 0.1);
        padding: 24px;
        border-radius: 8px;
        margin-bottom: 16px;
        
        svg {
            cursor: pointer;
        }

        .name {
            position: relative;
            font-weight: bold;
            font-size: 14px;
            line-height: 1;
            color: rgba(255, 255, 255, 0.6);
            margin-bottom: 8px;

            button {
                position: absolute;
                right: 0;
                background-color: transparent;
                border: none;
                padding: 2px;
                border-radius: 4px;

                &:active {
                    background-color: rgba(0, 0, 0, 0.1);
                }
                
                @media (hover: hover) and (pointer: fine) {
                    &:hover {
                        background-color: rgba(0, 0, 0, 0.1);
                    }
                }

                &::before {
                    position: absolute;
                    display: block;
                    right: 25px;
                    top: 0;
                    text-align: center;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.5);
                    background-color: rgba(0, 0, 0, 0.1);
                    border-radius: 4px;
                    padding: 4px;
                    content: "Copied";
                    transition: opacity .4s;
                    opacity: 0;
                }

                &.copied::before {
                    opacity: 1;
                }

                svg {
                    fill: #fff;
                    height: 18px;
                    width: 18px;
                }
            }
        }

        .value {
            color: rgba(255, 255, 255, 0.85);
            word-break: break-all;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            font-size: 14px;
        }
    }
}
</style>