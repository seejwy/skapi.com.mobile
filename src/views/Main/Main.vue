<template lang="pug">
NavBar(:is-parent-level="Object.keys(route.query).length === 0 || route.name === 'settings' || route.name === 'confirmation'" style='z-index: 10;background-color: var(--app-nav-bg-color);')
    ul.inlineVerticalMiddle(@click='bypassSameRoute')
        li
            router-link(to="/" tag="li")
                img(src="@/assets/img/logo.svg" style="width: 90px; height: 35px;")
        li
                a(href="https://docs.skapi.com" target="_blank") Documentation

        li(v-if='state.user')
            router-link(to="/admin") Admin

        template(v-if='state.connection')

            template(v-if='state.user')
                li
                    router-link(to="/account-settings") Account Settings

                li
                    a.clickable(@click="logout") Logout

            template(v-else)
                li
                    router-link(to="/admin") Login

                li
                    router-link(to="/signup") Sign-up
main(v-if="route.name === 'home'")
    router-view
main.app(v-else-if="noLoginNeeded()")
    router-view
main.app(v-else)
    .wrapper
        Login
</template>

<script setup>
import NavBar from '@/components/Navbar.vue';
import { useRouter, useRoute } from 'vue-router';
import { skapi, state } from '@/main';

import Login from './Login.vue';
let router = useRouter();
let route = useRoute();

const noLoginNeeded = () => {
    if(!state.user) {
        switch(route.name) {
            case 'forgotpassword':
            case 'signup':
            case 'confirmation':
            case 'success':
            case 'home':
            case 'deleted':
            case 'sample':
                return true;
        }

        return false;
    } else {
        return true;
    }
}

const logout = async () => {
    await router.push({ name: 'home' });
    skapi.AdminLogout().then(() => { state.user = null; })
}

function bypassSameRoute(e) {
    // bypass when same route is clicked
    let routeName = {
        'Admin': 'admin',
        'Login': 'login'
    }[e.target.textContent.trim()];

    if (routeName && route.name !== routeName) {
        e.stopPropagation();
    }
}
</script>