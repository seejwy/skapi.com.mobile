<template lang="pug">
template(v-if="record")
    ViewRecord(ref='viewRecord' :record='record')
.noRecordsFound(v-else-if="hasNoRecords")
    .title Record Not Found
    p Record does not exist
div(v-else style="text-align: center; padding: 1em;")
    Icon.animation-rotation(style="display:inline-block;width:32px;height:32px;") refresh
</template>
<script setup>
import { inject, onBeforeUnmount, ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { skapi } from '@/main';

import Icon from '@/components/Icon.vue';
import ViewRecord from '@/views/Service/Records/ViewRecord.vue';

let viewRecord = ref(null);
let appStyle = inject('appStyle');
const hasNoRecords = ref(false);

let editCallback = () => {
    viewRecord.value.editRecord();
};

let router = useRouter();
let route = useRoute();

let record = inject('recordToOpen');
let record_id = route.query.id || null;

// kick out desktop users, or has no query
if (record.value === null && !record_id) {
    if (!record.value) {
        record.value = record_id;
    }
    router.push({ name: 'records' });
}

if (!record.value) {
    if(record_id !== 'Add Record') {
        skapi.getRecords({
            service: route.params.service,
            record_id
        }).then(r => {
            if(r.list.length) {
                record.value = r.list[0];
            } else {
                hasNoRecords.value = true;
            }
        }).catch(e => {
            router.replace(`/admin/${route.params.service}/records`);
        });
    } else {
        record.value = {};
    }
}

onMounted(() => {
    appStyle.mainPadding = '0';
    appStyle.background = '#333333';
    if (record.value && typeof record.value === 'object' && !Object.keys(record.value).length) {
        // is add record when empty object
        editCallback();
    }
});

onBeforeUnmount(() => {
    appStyle.mainPadding = null;
    appStyle.background = null;
});
</script>
<style lang="less">
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
}
</style>