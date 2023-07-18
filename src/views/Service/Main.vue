<template lang="pug">
.servicePageShell
    .sideScreen
        NavBar(v-if="route.name !== 'mobileSearchRecord' && route.name !== 'recordSearch' && route.name !== 'userSearch' && route.name !== 'mobileSearchUser' && !(route.name === 'users' && route.query.search)" style="background-color: #505050")
            ul.inlineVerticalMiddle
                li
                    router-link(to="/" tag="li")
                        img(src="@/assets/img/logo.svg" style="width: 90px; height: 35px;")
                li
                    a(href="https://docs.skapi.com" target="_blank") Documentation {{  route.query.search }}

                li
                    router-link(to="/admin" :class="{'router-link-active': route.path.split('/')[1] === 'admin'}") Admin

                li
                    router-link(to="/account-settings" tag="li") Account Settings

                li
                    a.clickable(@click="logout") Logout

        main.app#appMain(v-if='state.connection')
            NotExists(v-if='service === 404')
            template(v-else-if='service')
                router-view
            Login(v-if="!state.user")
    .sidebarHolder
        .sidebar(v-if="state.user")
            router-link(:to="{name: 'service'}" :class="{'router-link-active-mobile': !route.path.split('/')[3]}")
                Icon home
                span Service Home

            router-link(:to="{name: 'users'}" :class="{'router-link-active-mobile': route.path.split('/')[3] === 'users'}") 
                Icon users
                span Users

            router-link(:to="{name: 'records'}" :class="{'router-link-active-mobile': route.path.split('/')[3] === 'records'}")
                Icon folder_open
                span Records

            router-link(:to="{name: 'mail'}")
               Icon mail
</template>

<style lang="less">
@import '@/assets/variables.less';
.servicePageShell {
    display: block;

    // navbar title text
    .titleText {
        color: inherit;
    }

    .sidebarHolder {
        position: fixed;
        z-index: 10;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
    }
    .sidebar {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;

        background: var(--primary-color);
        overflow: hidden;
        box-shadow: 0px -4px 4px rgba(0, 0, 0, 0.25);
        border-radius: 12px 12px 0 0;
        width: 100%;

        &>* {
            display: inline-block;
            color: #fff;
        }

        &>a {
            display: block;
            width: 36px;
            height: 36px;
            margin: 12px 16px;
            border-radius: 4px;

            &.router-link-active-mobile,
            &:hover {
                background: rgba(255, 255, 255, 0.2);
            }

            svg {
                margin: 6px;
            }

            span {
                display: none;
                margin: 6px;
                font-weight: normal;
                font-size: 16px;
                white-space: nowrap;
                line-height: 24px;
            }
        }        
    }
}
</style>
<script setup>
import NavBar from '@/components/Navbar.vue';
import NotExists from '@/views/Main/404.vue';
import Login from '../Main/Login.vue';
import Icon from '@/components/Icon.vue';

import { provide, inject, watch, ref, onMounted, onBeforeUnmount, onUpdated } from 'vue';
import { skapi, state, awaitConnection } from '@/main';
import { useRoute, useRouter } from 'vue-router';
import { recordTables } from '@/helper/records.js';

let router = useRouter();

// this does not trigger again when nested routes change
let route = useRoute();
let serviceId = route.params.service;
let service = ref(null);

provide('service', service);
provide('serviceUsers', ref(null));
provide('userStatus', ref({}));
provide('fetchingData', ref(false));

onMounted(() => {
    awaitConnection.then(()=>{
        recordTables.value = null;
    });
});

const logout = async () => {
    await router.push({ name: 'home' });
    skapi.AdminLogout().then(() => { state.user = null; })
}

function getServices(gs) {
    if (!(gs instanceof Promise)) {
        return;
    }

    gs.then(services => {
        let region = skapi.region_list?.[serviceId.substring(0, 4)];
        if (!region) {
            // region does not exists
            service.value = 404
            return;
        }
        if(services[region]) {
            for (let s of services[region]) {
                if (s.service === serviceId) {
                    service.value = s;
                    return s;
                }
            }
        }

        // no matching service id
        service.value = 404;
    });
}

getServices(state.getServices);

// watch is for users visiting the page directly
watch(() => state.getServices, getServices);
watch(() => state.user, u => {
    if (!u) {
        // throw user to login page if not logged in
        router.push('/');
    }
});

document.body.classList.add('admin');
onBeforeUnmount(() => {
    document.body.classList.remove('admin');
})
</script>