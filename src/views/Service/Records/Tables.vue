<template lang="pug">
NavBarProxy
    template(v-slot:title)
        div Records
.pageHeader.headSpaceHelper
    p.
        Records are data objects created by you or your users and stored within your database.
        skapi's database is designed for flexibility and features automatic indexing.
        Find out how you make use of our advanced features to create a database that fits your needs.

    .action
        a(href="https://docs.skapi.com/database" target="_blank")
            sui-button.lineButton(type="button") Find out More

.table-container#data-container
    .header.label-head
        span.not-clickable Table name
        div.not-clickable
            span Size
            span # of records

    // skeleton
    .tableHead.animation-skeleton(v-if='recordTables === null' v-for="t in numberOfSkeletons()")
        span &nbsp;

    // table list
    template(v-else)
        .no-records(v-if='!recordTables.list?.length')
            div
                .title No Record Tables
                p List of tables will show when there is data

        template(v-else-if="groupedTableList && groupedTableList[currentSelectedTableBatch]")
            template(v-for="batchIdx in groupedTableList?.length")
                template(v-for="pageIdx in groupedTableList[batchIdx - 1]?.length")
                    // when v-for by number, it starts with 1
                    template(v-for="t in groupedTableList[batchIdx - 1][pageIdx - 1]")
                        .tableWrapper(v-if="t.number_of_records")
                            .tableHead.label-head.clickable(@click='()=>{viewRecordList(t)}')
                                span {{ t.table }}
                                div
                                    span {{getSize(t.size)}}
                                    span {{t.number_of_records}}

                                template(v-if='t.records')
                                    Icon.clickable(style="color: rgba(255, 255, 255, .6)") right

                                Icon.animationRotation(v-else) refresh
                .tableHead.animation-skeleton.showOnTablet(v-if='fetchingData' v-for="t in numberOfSkeletons()")
                    span &nbsp;

.pageAction.showOnTablet(@blur="isFabOpen = false")
    // @blur should be at the parent div
    sui-button.fab.openMenu(type="button" @click.stop="isFabOpen = !isFabOpen")
        Icon menu_vertical

    Transition
        div(v-if="isFabOpen" @click.stop)
            sui-button.fab(type="button" @click="router.push({name: 'mobileSearchRecord'})")
                Icon search
            sui-button.fab(type="button" @click='()=>addRecord()')
                Icon plus2
</template>
<!-- script below -->
<script setup>
import { inject, ref, watch, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { state, skapi } from '@/main';
import { getSize, dateFormat, groupArray } from '@/helper/common';
import { useRoute, useRouter } from 'vue-router';
import { tableList, recordTables, refreshTables, getMoreRecords } from '@/helper/records';

import NavBarProxy from '@/components/NavBarProxy.vue';
import RecordSearch from '@/components/recordSearch.vue';
import Icon from '@/components/Icon.vue';

const viewRecord = ref(null);
let route = useRoute();
let router = useRouter();
let serviceId = route.params.service;
let record = inject('recordToOpen');
const service = inject('service');

// flag
let fetchingData = inject('fetchingData');
let isFabOpen = ref(false);

// data
let searchResult = inject('searchResult');

// for paginators
let fetchLimit = 50;
let numberOfTablePerPage = 10;
let numberOfPagePerBatch = fetchLimit / numberOfTablePerPage;

let currentSelectedTableBatch = ref(0);
let currentSelectedTablePage = ref(0);

const isLastBatch = computed(() => {
    return currentSelectedTableBatch.value === groupedTableList?.value?.length - 1;
});

const isLastPage = computed(() => {
    return currentSelectedTablePage.value === groupedTableList?.value?.[currentSelectedTableBatch.value]?.length - 1;
});

const isEndOfList = computed(() => {
    return recordTables.value?.endOfList;
});

let groupedTableList = computed(() => {
    if (!recordTables.value || !recordTables.value.list.length) {
        currentSelectedTableBatch.value = 0;
        return null;
    }

    return groupArray(recordTables.value.list, numberOfTablePerPage, numberOfPagePerBatch);
});

if (groupedTableList.value) {
    for (let t of groupedTableList.value[0][0]) {
        // close all opened
        t.opened = false;
    }
}

function addRecord() {
    record.value = null;

    router.push({
        name: 'mobileRecordView',
        query: {
            id: 'Add Record'
        }
    });
}

let getMoreTablesQueue = null;
async function getMoreTables() {
    if (recordTables.value.endOfList && groupedTableList.value.length - 1 === currentSelectedTableBatch.value) {
        return;
    }

    fetchingData.value = true;

    if (groupedTableList.value.length - 1 > currentSelectedTableBatch.value) {
        currentSelectedTableBatch.value += 1;
        currentSelectedTablePage.value = 0;
        fetchingData.value = false;
        return;
    }

    if (getMoreTablesQueue instanceof Promise) {
        return;
    }

    getMoreTablesQueue = skapi.getTables({ service: serviceId }, { fetchMore: true, limit: fetchLimit }).catch(err => {
        fetchingData.value = false;
        throw err;
    });

    let t = await getMoreTablesQueue;
    recordTables.value.endOfList = t.endOfList;

    t.list.map(m => {
        if (!tableList.includes(m.table)) {
            tableList.push(m.table);
        }

        m.opened = false;
        m.records = ref(null);

        skapi.getRecords({
            service: serviceId,
            table: { name: m.table }
        }, { limit: fetchLimit }).then(r => {
            m.records.value = r;
        });

        recordTables.value.list.push(m);
    });

    currentSelectedTableBatch.value += 1;
    currentSelectedTablePage.value = 0;

    fetchingData.value = false;
    getMoreTablesQueue = null;
}

function getTables() {
    // initial table fetch
    currentSelectedTablePage.value = 0;
    currentSelectedTableBatch.value = 0;

    fetchingData.value = true;
    refreshTables(serviceId).then(() => {
        fetchingData.value = false;
    });

}

// get tables on created (if not already fetched)
if (!recordTables.value) {
    getTables();
}

function numberOfSkeletons() {
    // calculated by available vertical space
    return parseInt((window.innerHeight / 2) / 48);
}

function viewRecordList(t) {
    searchResult.value = t.records;
    router.push(`/admin/${serviceId}/records/list?table=${t.table}`);
}

// watchers
let appStyle = inject('appStyle');

const close = async () => {
    await state.blockingPromise;
    viewRecord.value.close();
}

appStyle.background = '#434343';

watch(currentSelectedTablePage, n => {
    // close opened table on page change
    for (let t of groupedTableList.value[currentSelectedTableBatch.value][n]) {
        t.opened = false;
    }
    nextTick(() => {
        window.document.getElementById('data-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
});

watch(currentSelectedTableBatch, n => {
    // close opened table on batch change
    for (let t of groupedTableList.value[n][currentSelectedTablePage.value]) {
        t.opened = false;
    }
    nextTick(() => {
        window.document.getElementById('data-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
});

document.body.classList.add('table');

function scrollEventMobile(event) {
    if ((window.document.documentElement.clientHeight + window.scrollY) >= document.body.offsetHeight - 60) {
        // scrolled to bottom
        getMoreTables();
    }
}

window.addEventListener('scroll', scrollEventMobile, { passive: true });

onBeforeUnmount(() => {
    document.body.classList.remove('table');
    window.removeEventListener('scroll', scrollEventMobile, { passive: true });
    // set padding to original value
    appStyle.mainPadding = null;
    appStyle.background = null;
});
</script>

<style lang="less" scoped>
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

#recordSearch {
    z-index: 1;
    display: inline-block;
    position: relative;
    max-width: 100%;
}

.table-container {
    background-color: #434343;
    position: relative;
    margin: 24px 0 0 0;

    svg {
        color: white;
    }

    .header {
        padding: 0 16px 0 16px;
        color: rgba(255, 255, 255, 0.4);
        display: flex;
        align-items: center;
        flex-wrap: wrap;

        &+.tableWrapper {
            margin-top: 24px;
        }
    }

    .tableWrapper {
        background-color: #333333;
        border-radius: 8px;

        .records {
            display: flex;
            flex-wrap: wrap;
            flex-direction: column;
            justify-content: space-between;
            font-size: 14px;
            padding: 16px 20px;

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
                }

                span {
                    font-family: Courier;

                    &.label-head {
                        color: rgba(255, 255, 255, 0.6);
                    }
                }
            }

            &.deleting {
                opacity: 0.3;
            }
        }

        .load-more {
            text-align: center;
            padding: 8px;
        }
    }


    .label-head {
        &>span {
            display: inline-block;
            text-align: left;
            max-width: 50%;
            flex-grow: 1;
            padding-right: 0.5em;
            display: inline-block;
            text-overflow: ellipsis;
            overflow: hidden;
        }

        &>div {
            position: relative;
            min-width: calc(50% - 24px);

            &>span {
                display: inline-block;
                width: 50%;
                white-space: nowrap;
                padding-right: 0.5em;
            }
        }
    }

    .tableHead {
        background: #656565;
        border-radius: 4px;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        margin-top: 16px;
    }

    .noRecords {
        padding: 16px 0;
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: .6;
        flex-wrap: wrap;

        p {
            font-size: 14px;
            margin: 0;
        }
    }

    .no-records {
        color: rgba(255, 255, 255, 0.4);
        padding: 60px 0 60px 0;
        margin: 0 -20px -24px -20px;
        border-radius: 0 0 8px 8px;
        text-align: center;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;

        .title {
            font-size: 28px;
        }

        p {
            margin: 20px 0 0 0;
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