<template lang="pug">
template(v-if="user")
    NavBarProxy
        template(v-slot:leftButton)        
            Icon.clickable.backButton(@click="backHandler") left
        template(v-slot:title)
            div(style="overflow: hidden; text-overflow: ellipsis;") {{  user.user_id }}
        template(v-slot:rightButton)
            div
    .head
        .tab Information
    .container
        template(v-if="user")
            .label(v-for="key in info")
                span {{ key.name || key.key }}
                .value(:class="key.class") 
                    Icon(v-if="key.icon") {{ key.icon(user[key.key]) }}
                    span {{ key.filter ? key.filter(user[key.key]) : user[key.key] || '-'}}

div(v-else style="text-align: center; padding: 1em;")
    Icon.animation-rotation(style="display:inline-block;width:32px;height:32px;") refresh
</template>
<script setup>
import { inject, ref, reactive, watch, onBeforeUnmount } from 'vue';
import { state, skapi } from '@/main';
import { useRouter, useRoute } from 'vue-router';

import NavBarProxy from '@/components/NavBarProxy.vue';
import Icon from '@/components/Icon.vue';

let appStyle = inject('appStyle');
const router = useRouter();
const route = useRoute();

let user = ref(null);
let serviceId = route.params.service;
let serviceUsers = inject('serviceUsers');

appStyle.mainPadding = null;

const backHandler = () => {
    // if search page, go back to search page
    if(router.options.history.state.back) {
        let url = new URLSearchParams(router.options.history.state.back.substring(router.options.history.state.back.indexOf('?')))
        if(url.has('search')) {
            router.go(-1);
        } else {
            router.push({name: 'users'});
        }
    } else {
        router.push({name: 'users'});
    }
}

const info = reactive([
    {
        key: 'user_id',
        name: 'User ID'
    },
    {
        key: 'name'
    },
    {
        key: 'approved',
        name: 'Block/Unblocked',
        icon: (value) => {
            return value.includes('approved') ? 'unblock' : 'block';
        },
        filter: (value) => {
            return value.includes('approved') ? 'Unblocked' : 'Blocked';
        }
    },
    {
        key: 'group',
        name: 'Status',
        icon: (value) => {
            return value > 0 ? 'check_circle' : 'X';
        },
        filter: (value) => {
            return value > 0 ? 'Enabled' : 'Disabled';
        }
    },
    {
        key: 'gender',
        class: 'capitalize'
    },
    {
        key: 'address'
    },
    {
        key: 'email'
    },
]);

let userIdx = serviceUsers.value?.list.findIndex((user) => {
    return user.user_id === route.params.user_id;
});

if(userIdx >= 0) {
    user.value = serviceUsers.value.list[userIdx];
} else {
    skapi.getUsers({
        service: serviceId,
        searchFor: 'user_id',
        condition: '=',
        value: route.params.user_id
    }).then((res) => {
        user.value = res.list[0];
    });
}

appStyle.background = '#333333';

onBeforeUnmount(() => {
    appStyle.background = null;
})
</script>
<style lang="less" scoped>
@import '@/assets/variables.less';
.head {
    background-color: #595959;
    margin: 0 -20px;
    .tab {
        background-color: #333333;
        display: inline-block;
        margin: 12px 0 0 8px;
        border-radius: 8px 8px 0px 0px;
        padding: 0 12px;
        line-height: 40px;
    }

    @media @phone {
        margin: 0 -16px;
    }
}
.container {
    background-color: #333333;
    padding: 32px 20px;

    .label {
        color: #fff;
        margin-bottom: 32px;
        display: block;

        & > span {
            font-weight: bold;
            color: rgba(255, 255, 255, .4);
            text-transform: capitalize;
        }

        &:last-child {
            margin: 0;
        }

        .capitalize {
            text-transform: capitalize;
        }

        .value {
            margin-top: 8px;
            svg {
                margin-right: 10px;
            }
            span {
                vertical-align: middle;
            }
        }
    }

    @media @tablet {
        margin: 0 -20px;
    }
    
    @media @phone {
        padding: 31px 16px;
        margin: 0 -16px;
    }
}
</style>