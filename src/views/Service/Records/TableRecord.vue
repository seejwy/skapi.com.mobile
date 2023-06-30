<template lang="pug">
NavBarProxy(v-if="route.query.table")
    template(v-slot:leftButton)
        Icon.clickable.backButton(@click="router.push({name: 'records'})") left
    template(v-slot:title)
        div(style="overflow: hidden; text-overflow: ellipsis;") {{ route.query.table }}
    template(v-slot:rightButton)
        div
.recordContainer#data-container
    .recordWrapper.animation-skeleton(v-if='searchResult === null')
        .records.clickable(v-for="t in numberOfSkeletons()")
            div
                span.label &nbsp; 
                span &nbsp;
            div
                span.label &nbsp;
                span &nbsp;
            div
                span.label &nbsp;
                span &nbsp;

    template(v-else)
        div(v-if='!searchResult.list.length')
            .noRecordsFound
                .title No Records
                p There are no records in this table
        template(v-else)
            .recordWrapper
                .records(v-for="r in searchResult.list" style="cursor:pointer;" @click="()=>displayRecord(r)" :style="{opacity: r.deleting ? '0.3' : null}")
                    div
                        span.label RECORD:
                        span {{ r.record_id }}
                    div
                        span.label USER:
                        span {{ r.user_id }}
                    div
                        span.label UPLOADED: 
                        span {{ dateFormat(r.uploaded) }}
            .recordWrapper.animation-skeleton(v-if="promiseQueue")
                .records.clickable(v-for="t in numberOfSkeletons()")
                    div
                        span.label &nbsp; 
                        span &nbsp;
                    div
                        span.label &nbsp;
                        span &nbsp;
                    div
                        span.label &nbsp;
                        span &nbsp;

</template>
<!-- script below -->
<script setup>
import { inject, ref, watch, computed, nextTick, onBeforeUnmount, onMounted } from 'vue';
import { skapi } from '@/main';
import { dateFormat, groupArray } from '@/helper/common'
import { useRoute, useRouter } from 'vue-router';

import NavBarProxy from '@/components/NavBarProxy.vue';
import RecordSearch from '@/components/recordSearch.vue';
import Icon from '@/components/Icon.vue';

let route = useRoute();
let router = useRouter();
let serviceId = route.params.service;

// record page has darker background in mobile mode
let appStyle = inject('appStyle');
let record = inject('recordToOpen');
record.value = null;

appStyle.mainPadding = '0';
appStyle.background = '#333333';

// data
let searchResult = inject('searchResult');

// for paginators
let fetchLimit = 50;

function numberOfSkeletons() {
    // calculated by available vertical space
    return parseInt(window.innerHeight / 2 / 48);
}

function scrollEventMobile(event) {
    if ((window.document.documentElement.clientHeight + window.scrollY) >= document.body.offsetHeight - 60) {
        // scrolled to bottom
        fetchMoreRecords();
    }
}

window.addEventListener('scroll', scrollEventMobile, { passive: true });

onMounted(() => {
    if (searchResult.value) return;
    let params = {
        service: serviceId,
        table: {
            name: route.query.table
        }
    };

    skapi.getRecords(params, { limit: fetchLimit })
        .then(r => {
            searchResult.value = r;
            searchResult.value.params = params;
            fetchMoreRecords();
        }).catch(err => {
            searchResult.value = {
                endOfList: true,
                list: []
            };
            throw err;
        });
});

onBeforeUnmount(() => {
    window.removeEventListener('scroll', scrollEventMobile, { passive: true });
    // set padding to original value
    appStyle.mainPadding = null;
    appStyle.background = null;
});

let promiseQueue = ref(null);

async function fetchMoreRecords() {
    if (!searchResult.value.endOfList) {
        let params = {
            service: serviceId,
            table: {
                name: route.query.table
            }
        };

        if (promiseQueue.value instanceof Promise) {
            return;
        }

        promiseQueue.value = skapi.getRecords(params, { fetchMore: true, limit: fetchLimit });
        let result = await promiseQueue.value;
        for (let rec of result.list) {
            searchResult.value.list.push(rec);
        }

        searchResult.value.endOfList = result.endOfList;
        promiseQueue.value = null;
        result = null;
    }
}

let recordToOpen = inject('recordToOpen');
function displayRecord(r) {
    recordToOpen.value = r;
    router.push({
        name: 'mobileRecordView',
        query: {
            id: r.record_id
        }
    });
}

</script>

<style lang="less" scoped>
@import '@/assets/variables.less';

.recordContainer {
    position: relative;
    margin: 0;
    padding: 0;

    .recordWrapper {
        background-color: #333333;
        border-radius: 8px;
        margin-top: 1.5em;
        margin: 0 !important;

        .records {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            flex-direction: column;
            font-size: 14px;
            padding: 16px 20px;
            border-radius: 0 !important;
            padding-right: 16px !important;
            padding-left: 16px !important;


            &:nth-child(odd) {
                background-color: rgba(255, 255, 255, 0.04);
            }

            &:last-child {
                border-radius: 0 0 8px 8px;
            }

            &:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            div {
                &:not(:last-child) {
                    margin-right: .75em;
                    margin-bottom: 2px !important;
                }

                span {
                    font-family: Courier;
                    display: inline-block;

                    &.label {
                        color: rgba(255, 255, 255, 0.6);
                    }
                }
            }
        }
    }

    @media @phone {
        .recordWrapper {
            .records {
                div {
                    &:not(:last-child) {
                        margin-bottom: 4px !important;
                    }

                    span {
                        display: block !important;
                    }
                }
            }
        }
    }

    .noRecordsFound {
        text-align: center;
        border-radius: 0 0 8px 8px;
        color: rgba(255, 255, 255, .4);
        align-items: center;
        text-align: center;
        padding: 60px 0 32px 0;

        .title {
            font-size: 28px;
        }

        p {
            margin: 20px 0 0 0;
        }

        .query {
            margin-top: 16px;
            text-align: center;
            color: rgba(255, 255, 255, .6);
        }
    }
}
</style>