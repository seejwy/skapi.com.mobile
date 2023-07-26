<template lang="pug">    
NavBarProxy
    template(v-slot:title)
        div Users
.pageHeader.headSpaceHelper
    p.
        Users are individuals who have successfully created an account and logged in at least once. 
        You can perform searches and apply access control on this page.
        Find out how you can easily perform authentication and manage your users.
    .action
        a(href="https://docs.skapi.com/authentication" target="_blank")
            sui-button.lineButton(type="button") Find out More
    div(style="clear:both;")
.tableOuterWrapper(:loading="promiseRunning || null")
    .tableActions(:class="{'rounded-border' : !serviceUsers?.list?.length && fetchingData}")
        .headerActions(v-if="serviceUsers?.list.length")
            div.dropdown
                span Headers
                Icon down2
            sui-select(:value="mobileVisibleField" @change="(e) => mobileVisibleField = e.target.value")
                template(v-for="(field, key) in visibleFields")
                    option(v-if="key !== 'approved'" :value="key") {{  field.text  }}
        .headerActions(v-else)
        .actions
            sui-button.icon-button(type="button" @click="blockUsers" :disabled="(selectedUnblockedUsers.length === 0 || selectedBlockedUsers.length > 0) || null")
                Icon block
            sui-button.icon-button(type="button" @click="unblockUsers" :disabled="(selectedBlockedUsers.length === 0 || selectedUnblockedUsers.length > 0) || null")
                Icon unblock
            sui-button.icon-button(type="button" @click="deleteUsers" :disabled="selectedUsers.length === 0 || null")
                Icon trash

    .tableWrapper

        table(v-if="!serviceUsers?.list?.length && fetchingData")
            tbody
                tr(v-for="x in numberOfSkeletons()").animation-skeleton
                    td
        table(v-else)
            thead(v-if="serviceUsers?.list?.length && (!fetchingData || serviceUsers?.list?.length)")
                tr(:class="{rounded: fetchingData || null}")
                    th

                    th(style="width: 52px;") Block
                    th(:class="{'iconTd': key === 'block' || key === 'status', 'userId': key === 'user_id'}") {{ visibleFields[mobileVisibleField].text }}
            tbody(v-if="serviceUsers?.list?.length")
                template(v-for="user in serviceUsers.list" :key="user['user_id']")
                    tr(v-if="userStatus[user.user_id] !== 'deleted'" :id="user['user_id']")
                        td
                            sui-input(type="checkbox" :disabled="promiseRunning || null" :value="user.user_id" :checked="selectedUsers.includes(user.user_id) || null" @change="userSelectionHandler")
                        td(style="width: 52px;")
                            template(v-if="userStatus[user.user_id]")
                                Icon(v-if="userStatus[user.user_id].includes('suspended')" style="opacity: 40%;") block
                                Icon(v-else) unblock
                            template(v-else)
                                Icon(v-if="user['approved']?.includes('suspended')" style="opacity: 40%;") block
                                Icon(v-else) unblock
                        td(@click="router.push({name: 'userView', params: {user_id: user['user_id']}})")
                            template(v-if="mobileVisibleField === 'group'")                     
                                Icon(v-if="user[mobileVisibleField] > 0") check_circle
                                Icon(v-else) x
                            template(v-else-if="mobileVisibleField === 'access_group'")
                                span(v-if="user['group'] === 99") Admin
                                span(v-else) User
                            template(v-else-if="mobileVisibleField === 'timestamp'")
                                span {{ dateFormat(user['timestamp']) }}
                            template(v-else-if="mobileVisibleField === 'birthdate'")
                                span(v-if="user['birthdate']") {{ dateFormat(user['birthdate']) }}
                                span(v-else) -
                            template(v-else) {{ user[mobileVisibleField] || '-' }}
                        td
                template(v-if="fetchingData")
                    tr(v-for="x in numberOfSkeletons()").animation-skeleton
                        td
                        td(style="width: 52px;")
                        td
                        td
    .noUsersFound(v-if="!serviceUsers?.list?.length && !fetchingData")
        template(v-if="!serviceUsers?.list?.length")     
            .title No Users
            p You have no existing users yet
        template(v-else) 
            .title No Users Found
            p There were no users matching the query.
.pageAction(@blur="isFabOpen = false")
    sui-button.fab.openMenu(type="button" @click.stop="isFabOpen = !isFabOpen")
        Icon menu_vertical

    Transition
        div(v-if="isFabOpen" @click.stop)
            sui-button.fab(type="button" @click="router.push({name: 'mobileSearchUser'})")
                Icon search
sui-overlay(ref="confirmOverlay")
    .popup
        .title
            Icon warning
            div(v-if="actionType === 'delete'") Deleting Users
            div(v-else-if="actionType === 'block'") Blocking Users
            div(v-else-if="actionType === 'unblock'") Unblocking Users
        .body 
            p Do you wish to continue?
        .foot
            sui-button.textButton(type="button") No 
            sui-button.textButton(type="button") Yes
</template>
<script setup>
import { inject, ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { skapi, state } from '@/main';
import { dateFormat } from '@/helper/common'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';

import Icon from '@/components/Icon.vue';
import NavBarProxy from '@/components/NavBarProxy.vue';
import SearchNavBar from '@/components/SearchNavBar.vue';

let route = useRoute();
let router = useRouter();
let serviceId = route.params.service;
const searchField = ref(null);
const service = inject('service');

let fetchLimit = 50;

const appStyle = inject('appStyle');

const visibleFields = reactive({
    approved: {
        text: 'Block',
        show: false
    },
    group: {
        text: 'Active',
        show: false
    },
    access_group: {
        text: 'Access',
        show: false,
    },
    user_id: {
        text: 'User ID',
        show: true,
    },
    name: {
        text: 'Name',
        show: false
    },
    email: {
        text: 'Email',
        show: false
    },
    address: {
        text: 'Address',
        show: false,
    },
    phone_number: {
        text: 'Phone',
        show: false
    },
    gender: {
        text: 'Gender',
        show: false,
    },
    birthdate: {
        text: 'Birthdate',
        show: false,
    },
    timestamp: {
        text: 'Date Created',
        show: false,
    },
    locale: {
        text: 'Locale',
        show: false,
    }
});

const promiseRunning = ref(false);
const confirmOverlay = ref(null);
const actionType = ref('');

const mobileVisibleField = ref('user_id');
const selectedBlockedUsers = ref([]);
const selectedUnblockedUsers = ref([]);

const selectedUsers = computed(() => {
    return [...selectedBlockedUsers.value, ...selectedUnblockedUsers.value];
});

const userSelectionHandler = (e) => {
    let user = serviceUsers.value.list.find((user) => {
        return user.user_id === e.target.value;
    });
    if (e.target.checked) {
        if (user.approved.includes('suspended')) {
            selectedBlockedUsers.value.push(e.target.value);
        } else {
            selectedUnblockedUsers.value.push(e.target.value);
        }
    } else {
        if (user.approved.includes('suspended')) {
            selectedBlockedUsers.value.splice(selectedBlockedUsers.value.indexOf(e.target.value), 1);
        } else {
            selectedUnblockedUsers.value.splice(selectedUnblockedUsers.value.indexOf(e.target.value), 1);
        }
    }
};

// flag
let fetchingData = inject('fetchingData');
let isFabOpen = ref(false);

// data
let serviceUsers = inject('serviceUsers');
let userStatus = inject('userStatus');
let searchResult = inject('searchResult');

let getMoreUsersQueue = null;

async function getMoreUsers() {
    if (fetchingData.value || serviceUsers.value?.endOfList) {
        return;
    }

    fetchingData.value = true;

    if (getMoreUsersQueue instanceof Promise) {
        return;
    }

    getMoreUsersQueue = skapi.getUsers(
        {
            service: serviceId,
            searchFor: 'timestamp',
            condition: '>=',
            value: 0
        }, { fetchMore: true, limit: fetchLimit }).catch(err => {
            fetchingData.value = false;
            throw err;
        });

    let result = await getMoreUsersQueue;
    serviceUsers.value.endOfList = result.endOfList;

    serviceUsers.value.list = serviceUsers.value.list.concat(result.list);

    getMoreUsersQueue = null;
    fetchingData.value = false;
}

const mobileScrollHandler = (e) => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
        getMoreUsers();
    }
}

function getUsers(refresh = false) {
    // initial table fetch
    if (!refresh && serviceUsers.value) {
        // bypass if already fetched
        fetchingData.value = false;
        return;
    }

    serviceUsers.value = null;
    fetchingData.value = true;

    let params = {
        service: serviceId,
        searchFor: 'timestamp',
        condition: '>=',
        value: 0
    };

    skapi.getUsers(params, { limit: fetchLimit })
        .then(t => {
            serviceUsers.value = {
                endOfList: t.endOfList,
                list: t.list,
                params
            };

            fetchingData.value = false;
        }).catch(err => {
            fetchingData.value = false;
            throw err;
        });

    return;
}

const toggleMobileDesktopSearchView = () => {
    appStyle.mainPadding = null;
    appStyle.background = '#434343';
}

function numberOfSkeletons() {
    // calculated by available vertical space
    return parseInt((window.innerHeight / 2) / 48);
}

const confirmActionDialog = async () => {
    return new Promise((res, rej) => {
        confirmOverlay.value.open();
        const noButton = confirmOverlay.value.querySelectorAll('sui-button')[0];
        const yesButton = confirmOverlay.value.querySelectorAll('sui-button')[1];

        noButton.addEventListener('click', () => {
            confirmOverlay.value.close();
            rej();
        });

        yesButton.addEventListener('click', async () => {
            confirmOverlay.value.close();
            res();
        });

    });
}

const blockUsers = async () => {
    if (promiseRunning.value || !selectedUnblockedUsers.value.length || selectedBlockedUsers.value.length || !state.user.email_verified) return false;
    try {
        actionType.value = 'block';
        await confirmActionDialog();
    } catch (e) {
        return false;
    }

    promiseRunning.value = true;
    let blockPromise = selectedUsers.value.map((user) => {
        return skapi.blockAccount({ service: serviceId, userId: user });
    });

    await Promise.all(blockPromise);
    selectedUnblockedUsers.value.forEach((sel) => {
        let idx = serviceUsers.value.list.findIndex((item) => {
            return item.user_id === sel
        });
        serviceUsers.value.list[idx].approved = 'admin:suspended';
    });

    selectedBlockedUsers.value = [...selectedUnblockedUsers.value];
    selectedUnblockedUsers.value = [];

    promiseRunning.value = false;
}

const unblockUsers = async () => {
    if (promiseRunning.value || !selectedBlockedUsers.value.length || selectedUnblockedUsers.value.length || !state.user.email_verified) return false;
    try {
        actionType.value = 'unblock';
        await confirmActionDialog();
    } catch (e) {
        return false;
    }

    promiseRunning.value = true;
    let unblockPromise = selectedUsers.value.map((user) => {
        return skapi.unblockAccount({ service: serviceId, userId: user });
    });

    await Promise.all(unblockPromise);
    selectedBlockedUsers.value.forEach((sel) => {
        let idx = serviceUsers.value.list.findIndex((item) => {
            return item.user_id === sel
        });
        serviceUsers.value.list[idx].approved = 'admin:approved';
    });
    selectedUnblockedUsers.value = [...selectedBlockedUsers.value];
    selectedBlockedUsers.value = [];

    promiseRunning.value = false;
}

const deleteUsers = async () => {
    if (promiseRunning.value || !selectedUsers.value.length || !state.user.email_verified) return false;
    try {
        actionType.value = 'delete';
        await confirmActionDialog();
    } catch (e) {
        return false;
    }

    promiseRunning.value = true;
    if (selectedUsers.value.length === 0 || !state.user.email_verified) return false;

    let deletePromise = selectedUsers.value.map((userId) => {
        document.getElementById(userId).classList.add('deleting');
        return skapi.deleteAccount({ service: serviceId, userId });
    });

    try {
        let result = await Promise.all(deletePromise);

        selectedUsers.value.forEach((user) => {
            let idx = serviceUsers.value.list.findIndex((res) => res.user_id === user);
            serviceUsers.value.list.splice(idx, 1);
        });
        selectedBlockedUsers.value = [];
        selectedUnblockedUsers.value = [];
    } catch (e) {
        console.log({ e });

        selectedUsers.value.forEach((user) => {
            document.getElementById(user).classList.remove('deleting');
        });
    }

    promiseRunning.value = false;
}

onMounted(() => {
    if (!serviceUsers.value?.list) {
        getUsers(true);
    }

    window.addEventListener('scroll', mobileScrollHandler, { passive: true });
    toggleMobileDesktopSearchView();
});

document.body.classList.add('table');
onBeforeUnmount(() => {
    document.body.classList.remove('table');
    window.removeEventListener('scroll', mobileScrollHandler, { passive: true });
    appStyle.background = null;
});

onBeforeRouteLeave((to, from) => {
    if (from.params.search && !to.params.search) {
        getUsers(true);
    }
});
</script>
<style lang="less" scoped>
@import '@/assets/variables.less';

.tableOuterWrapper {
    position: relative;
    margin: auto -20px;
    background-color: #434343;


    @media @phone {
        margin: auto -16px;
    }

    .search-query {
        display: flex;
        justify-content: space-between;
        font-weight: bold;
        padding: 24px 36px 0 20px;
        background: #434343;
        border-radius: 8px 8px 0 0;

        &+.tableActions {
            border-radius: 0;
        }

        svg {
            margin-left: 4px;
        }
    }

    .tableActions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #434343;
        padding: 14px 16px 14px 20px;
        border-radius: 8px 8px 0 0;
        color: rgba(255, 255, 255, 0.6);

        &>* {
            cursor: pointer;
        }

        &.rounded-border {
            border-radius: 8px;
        }

        .refresh {
            color: #fff;
        }

        .headerActions {
            position: relative;

            .dropdown>* {
                vertical-align: middle;
            }

            sui-select {
                position: absolute;
                top: 0;
                opacity: 0;
            }
        }
    }
}

.tableWrapper {
    overflow: hidden;

    table {
        min-width: 100%;
        border-collapse: collapse;

        thead,
        tbody {
            tr {
                background-color: #434343;

                td,
                th {
                    padding: 12px;
                    height: 52px;
                    white-space: nowrap;

                    &:first-child {
                        padding-left: 20px;
                        width: 48px;
                        min-width: 48px;
                    }

                    sui-input {
                        font-size: 16px;
                    }
                }

                &.rounded,
                &.rounded th {
                    border-radius: 0 0 8px 8px;
                }
            }
        }

        thead {
            th {
                position: sticky;
                background-color: #434343;
                color: rgba(255, 255, 255, 0.6);
                top: 0;
                text-align: left;

                &.iconTd {
                    width: 48px;
                    text-align: center;
                }

                &:last-child:not(.iconTd) {
                    width: 100%;
                }
            }

            .actions {
                cursor: pointer;
                text-align: right;

                svg {
                    margin-left: 4px;
                }
            }
        }

        tbody {
            tr {
                &:nth-child(odd) {
                    background: #4a4a4a;
                }

                &.deleting td {
                    opacity: 0.3;
                }

                td {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    max-width: 0;
                    width: 100%;
                    font-size: 14px;

                    &.iconTd {
                        width: 48px;
                        text-align: center;
                    }

                    &:last-child:not(.iconTd) {
                        width: 100%;
                    }
                }
            }
        }

        tr {
            height: 52px;

            td {
                white-space: nowrap;
            }
        }
    }
}

.noUsersFound {
    text-align: center;
    padding: 60px 0;
    border-radius: 0 0 8px 8px;
    color: rgba(255, 255, 255, .4);
    background: #434343;

    .title {
        font-size: 28px;
    }

    p {
        margin: 20px 0 0 0;
    }
}

.paginator {
    padding: 24px 0;
    text-align: center;
    color: rgba(255 255 255 / 60%);
    background: #434343;
    user-select: none;
    border-radius: 0 0 8px 8px;

    span {
        padding: 4px 8px;
        box-sizing: content-box;

        &.page {
            cursor: pointer;

            &.active {
                cursor: default;
                color: #fff;
                font-weight: bold;
            }
        }

        &.more-page {
            visibility: hidden;

            &.active {
                cursor: pointer;
                visibility: visible;
            }
        }
    }

    svg {
        color: rgba(255, 255, 255, .15);
        vertical-align: middle;

        &.active {
            cursor: pointer;
            color: #fff;
        }
    }
}

.pageAction {
    position: fixed;
    bottom: 76px;
    right: 16px;
    overflow: hidden;

    &>sui-button {
        z-index: 2;
    }

    &,
    &>div {
        display: flex;
        flex-direction: column-reverse;
        align-items: center;
        gap: 12px;
        width: 48px;
    }

    .v-enter-active,
    .v-leave-active {
        transition: opacity .1s ease, transform .1s ease;
        opacity: 1;
    }

    .v-enter-from,
    .v-leave-to {
        opacity: 0;
        transform: translateY(100px);
    }
}

input {
    -webkit-appearance: none;
}
</style>