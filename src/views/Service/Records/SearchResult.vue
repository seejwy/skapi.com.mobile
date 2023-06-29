<template lang="pug">
SearchNavBar
    div {{ searchTitle }}
    template(v-slot:right) 
        Icon.placeholderIcon(@click="()=>{ searchResult=null; currentSelectedRecordPage=0; currentSelectedRecordBatch=0; router.push({name: 'mobileSearchRecord'})}") X2

.recordContainer#data-container
    // skeleton
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
                .title No Records Found
                p There was no record matching the query:
                .query(v-if='route.query?.access_group')
                    span Access Group: {{ route.query.access_group === '0' ? 'Public' : route.query.access_group === '1' ? 'Registered' : route.query.access_group }}
                    template(v-if='route.query.search_type === "user" && route.query?.table')
                        br
                        span Table: {{ route.query.table }}
                    template(v-if='route.query?.subscription')
                        br
                        span Subscription: {{ route.query.subscription === 'null' ? 'None' : route.query.access_group === 'true' ? 'Subscribed' : 'Public' }}
                    template(v-if='route.query.search_type === "table" && route.query?.reference')
                        br
                        span Reference: {{ route.query.reference }}
                    template(v-if='route.query?.index_name')
                        br
                        span Index: {{ route.query.index_type === 'string' ? '"' + route.query.index_value + '"' : route.query.index_value }} {{ route.query.index_condition }} [{{ route.query.index_name }}]
                    template(v-if="route.query?.tag")
                        br
                        span Tag: {{ route.query.tag }}

        template(v-else-if="groupedRecordList && groupedRecordList[currentSelectedRecordBatch]")
            .recordWrapper
                template(v-for="batchIdx in groupedRecordList.length")
                    template(v-for="pageIdx in groupedRecordList[batchIdx - 1].length")
                        // when v-for by number, it starts with 1
                        .records(v-for="r in groupedRecordList[batchIdx - 1][pageIdx - 1]" style="cursor:pointer;" @click="()=>displayRecord(r)" :style="{opacity: r.deleting ? '0.3' : null}")
                            div
                                span.label RECORD:
                                span {{ r.record_id }}
                            div
                                span.label USER:
                                span {{ r.user_id }}
                            div
                                span.label UPLOADED: 
                                span {{ dateFormat(r.uploaded) }}
                                .recordWrapper.animation-skeleton(v-if='searchResult === null')
            .recordWrapper.animation-skeleton(v-if="fetchingData")
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
import { inject, ref, watch, computed, nextTick, onBeforeUnmount } from 'vue';
import { state, skapi } from '@/main';
import { dateFormat, groupArray } from '@/helper/common'
import { useRoute, useRouter } from 'vue-router';

import SearchNavBar from '@/components/SearchNavBar.vue';
import RecordSearch from '@/components/recordSearch.vue';
import Icon from '@/components/Icon.vue';

let route = useRoute();
let router = useRouter();
let serviceId = route.params.service;
let viewRecord = ref(null);

// record page has darker background in mobile mode
let appStyle = inject('appStyle');
let record = inject('recordToOpen');
record.value = null;

appStyle.mainPadding = '0';
appStyle.background = '#333333';

// flag
let fetchingData = inject('fetchingData');

// page title
let searchTitle = computed(() => {
    let s = `${fetchingData.value ? "Searching" : ''}${fetchingData.value ? '' : ' ' + route.query.search_type.replace('_', ' ')}: "${route.query[route.query.search_type === 'user' ? 'reference' : route.query.search_type === 'record' ? 'record_id' : route.query.search_type]}"${fetchingData.value ? ' ...' : ''}`;
    let capitalized = s.trim().replace(/^\w/, c => c.toUpperCase());

    return capitalized;
});

// data
let searchResult = inject('searchResult');

// for paginators
let fetchLimit = 50;
let numberOfRecordPerPage = 10;
let numberOfPagePerBatch = fetchLimit / numberOfRecordPerPage;
let currentSelectedRecordPage = ref(0);
let currentSelectedRecordBatch = ref(0);

let groupedRecordList = computed(() => {
    if (!searchResult.value || !searchResult.value.list.length) {
        currentSelectedRecordBatch.value = 0;
        return null;
    }
    let recList = groupArray(searchResult.value.list, numberOfRecordPerPage, numberOfPagePerBatch);
    return recList;
});

watch(currentSelectedRecordPage, n => {
    // close opened table on page change
    for (let t of groupedRecordList.value[currentSelectedRecordBatch.value][n]) {
        t.opened = false;
    }
    nextTick(() => {
        window.document.getElementById('data-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
});

function numberOfSkeletons() {
    // calculated by available vertical space
    return parseInt(window.innerHeight / 2 / 48);
}

function scrollEventMobile(event) {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
        // scrolled to bottom
        fetchMoreRecords();
    }
}

window.addEventListener('scroll', scrollEventMobile, { passive: true });

onBeforeUnmount(() => {
    window.removeEventListener('scroll', scrollEventMobile, { passive: true });
    // set padding to original value
    appStyle.mainPadding = null;
    appStyle.background = null;
});

let openRecord = ref(null);

let promiseQueue = null;
async function fetchMoreRecords() {
    if (!groupedRecordList.value || searchResult.value.endOfList && groupedRecordList.value.length - 1 === currentSelectedRecordBatch.value) {
        return;
    }

    fetchingData.value = true;

    if (groupedRecordList.value.length - 1 > currentSelectedRecordBatch.value) {
        currentSelectedRecordBatch.value += 1;
        currentSelectedRecordPage.value = 0;
        fetchingData.value = false;
        return;
    }

    if (promiseQueue instanceof Promise) {
        return;
    }

    fetchingData.value = true;
    promiseQueue = skapi.getRecords(searchResult.value.params, { fetchMore: true, limit: fetchLimit });

    promiseQueue = await promiseQueue;

    for (let rec of promiseQueue.list) {
        searchResult.value.list.push(rec);
    }

    fetchingData.value = false;
    searchResult.value.endOfList = promiseQueue.endOfList;
    currentSelectedRecordBatch.value += 1;
    currentSelectedRecordPage.value = 0;
    fetchingData.value = false;
    promiseQueue = null;
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

.recordPageHead {
    padding: 50px 0;

    @media @tablet {
        padding: 24px 0;
    }
}

#recordSearch {
    z-index: 1;
    display: inline-block;
    position: relative;
    max-width: 100%;
}

.recordContainer {
    svg {
        color: white;
        margin-left: 4px;
    }

    position: relative;

    .searchPoints {
        padding-top: 16px;
        font-weight: bold;

        &>span {
            display: inline-block;
            background: rgba(255, 255, 255, 0.12);
            color: rgba(255, 255, 255, 0.6);
            border-radius: 12px;
            padding: .7em;
            margin: 2px;
        }
    }

    .header {
        padding: 0 16px;
        color: rgba(255, 255, 255, 0.6);
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        justify-content: space-between;
        vertical-align: middle;

        span {
            color: white;
            font-weight: bold;
        }
    }

    .recordWrapper {
        background-color: #333333;

        .records {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            flex-direction: column;
            font-size: 14px;
            padding: 16px 20px;

            &:nth-child(odd) {
                background-color: rgba(255, 255, 255, 0.04);
            }

            &:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            div {
                &:not(:last-child) {
                    margin-right: .75em;
                    margin-bottom: 2px;
                }

                span {
                    font-family: Courier;
                    display: inline-block;

                    &.label {
                        color: rgba(255, 255, 255, 0.6);
                    }
                }

                @media @phone {
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
        padding: 60px 0 32px 0;
        border-radius: 0 0 8px 8px;
        color: rgba(255, 255, 255, .4);
        align-items: center;
        text-align: center;

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

    .paginator {
        margin-top: 24px;
        text-align: center;
        color: rgba(255 255 255 / 60%);
        user-select: none;

        &>div {
            display: inline-block;
        }

        &>span {
            padding: 4px 8px;
            width: 24px;
            box-sizing: content-box;

            &.page {
                cursor: pointer;

                &.active {
                    cursor: default;
                    color: #fff;
                    font-weight: bold;
                }
            }

            &.morePage {
                visibility: hidden;

                &.active {
                    cursor: pointer;
                    visibility: visible;
                }
            }
        }

        .arrow {
            color: rgba(255, 255, 255, .15);

            &.active {
                cursor: pointer;
                color: #fff;
            }
        }
    }
}
</style>