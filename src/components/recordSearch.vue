<template lang="pug">
// search form
form(@submit.prevent="submitSearch")
    // navbar for mobile search
    SearchNavBar
        template(v-slot:left)    
            Icon.clickable.back-button(@click="router.push({name: 'records'})") left
        sui-input(
            type="search"
            :name="searchForm.type === 'table' ? 'table' : searchForm.type === 'user' ? 'reference' : 'record_id'"
            :placeholder="searchForm.type === 'table' ? 'Table name' : searchForm.type === 'user' ? 'User id' : 'Record id'"
            :value="searchForm.value"
            @input="e=>{ searchForm.value = e.target.value; }"
            @change="e => { if(!searchForm.isAdvanced) advancedForm = advancedFormInit(); }"
            @mounted="focusMe"
            autocomplete="off"
            required)
            
        template(v-slot:right) 
            sui-button(type="submit").icon-button  
                Icon.showOnTablet.placeholderIcon search
    .mobile-search-type(style="margin: 8px 0;")
        sui-select(
            name='search_type'
            :value="searchForm.type"
            @input="e => {searchForm.type = e.target.value; if(e.target.value === 'record') searchForm.isAdvanced = false; searchForm.value = ''; }")
            option(value="table" selected) Search By Table Name
            option(value="user") Search By User ID
            option(value="record") Search By Record ID

    .toggle-advanced-form(v-if="searchForm.type !== 'record'" @click="searchForm.isAdvanced=!searchForm.isAdvanced")
        hr
        span(:class="{'close': searchForm.isAdvanced }") Advanced Search
        Icon down2

    // advanced search
    .advanced-form(ref="advancedFormEl" v-if='searchForm.isAdvanced && searchForm.type !== "record"')
        .formLabel Access Group
        .form
            .labelRadio.clickable
                label.inlineVerticalMiddle(for='ag-reg') Registered
                sui-input#ag-reg(type='radio' value='1' name='access_group' @change='advancedForm.access_group = 1' :checked='advancedForm.access_group === 1 ? true : null')

            .labelRadio.clickable
                label.inlineVerticalMiddle(for='ag-pub') Public
                sui-input#ag-pub(type='radio' value='0' name='access_group' @change='advancedForm.access_group = 0' :checked='advancedForm.access_group === 0 ? true : null')

            .labelRadio.clickable
                label.inlineVerticalMiddle(for='ag-prv') Private
                sui-input#ag-prv(type='radio' value='private' name='access_group' @change='advancedForm.access_group = "private"' :checked='advancedForm.access_group === "private" ? true : null')

        template(v-if='searchForm.type === "user"')
            .formLabel Table Name
            .form
                // table
                sui-input(
                    style='width:100%'
                    required
                    name='table'
                    placeholder="Table Name"
                    :value="advancedForm.table || ''"
                    @input="e => advancedForm.reference = e.target.value")

            .formLabel Table Subscription
            .form
                .inlineVerticalMiddle(style='vertical-align: middle;width: 100%;display:inline-block;')
                    // subscription
                    .labelRadio.clickable
                        label.inlineVerticalMiddle(for='subscription-none') None
                        sui-input#subscription-none(type='radio' name='subscription' value='null' @change='e=>{advancedForm.subscription = null; parseIndexType()}' :checked="advancedForm.subscription === null || null")

                    .labelRadio.clickable
                        label.inlineVerticalMiddle(for='subscription-public') Public
                        sui-input#subscription-public(type='radio' name='subscription' value='false' @change='e=>{advancedForm.subscription = false; parseIndexType()}' :checked="advancedForm.subscription === false || null")

                    .labelRadio.clickable
                        label.inlineVerticalMiddle(for='subscription-sub') Subscribed
                        sui-input#subscription-sub(type='radio' name='subscription' value='true' @change='e=>{advancedForm.subscription = true; parseIndexType()}' :checked="advancedForm.subscription === true || null")

        .formLabel Index
        .form
            // index name
            sui-input(
                style='width:100%'
                name="index_name"
                placeholder="Index Name"
                :required="advancedForm.index_value === undefined ? null : true"
                :value="advancedForm.index_name"
                pattern="[a-zA-Z0-9.]+"
                @input="e => advancedForm.index_name = e.target.value")

            br
            br

            // index data type
            sui-select(
                name="index_type"
                style="vertical-align: middle; width: 100px; margin-right:1em;"
                :value='advancedForm.index_type'
                @change="e=>{ advancedForm.index_type = e.target.value; parseIndexType(); }")
                option(disabled) Value type
                option(value="string" selected) String
                option(value="number") Number
                option(value="boolean") Boolean

            .inlineVerticalMiddle(v-if='advancedForm.index_type === "boolean"' style='vertical-align: middle;width: calc(100% - 100px - 1em);display:inline-block;')
                // index value (boolean)
                .labelRadio.clickable
                    label.inlineVerticalMiddle(for='typ-bool-true') True
                    sui-input#typ-bool-true(type='radio' name='index_value' value="true" @change='e=>{advancedForm.index_value = true; parseIndexType()}' :checked="(advancedForm.index_value === true) ? true : null")

                .labelRadio.clickable
                    label.inlineVerticalMiddle(for='typ-bool-false') False
                    sui-input#typ-bool-false(type='radio' name='index_value' value="false" @change='e=>{advancedForm.index_value = false; parseIndexType()}' :checked="(advancedForm.index_value === false) ? true : null")
            .select-input(v-else style='width: calc(100% - 100px - 1em);')
                // index value
                .input-field
                    sui-input(
                        autocomplete="off"
                        ref='indexValueFormElement'
                        name="index_value"
                        :type="advancedForm.index_type === 'number' ? 'number' : 'text'"
                        placeholder="Index value"
                        pattern="[a-zA-Z0-9' ']+"
                        :required="advancedForm.index_name ? true : null"
                        :value="advancedForm.index_value"
                        @input="()=>parseIndexType()")

                .select-field(style='overflow:hidden;flex-shrink: 0;')
                    // index value condition
                    sui-select(
                        style='width:60px'
                        name="index_condition"
                        :value="advancedForm.index_condition"
                        @change="e => advancedForm.index_condition = e.target.value")
                        option(disabled) Condition
                        option(value=">=") &gt;=
                        option(value=">") &gt;
                        option(value="=" selected) =
                        option(value="<") &lt;
                        option(value="<=") &lt;=

        .formLabel Tag
        .form
            // Tag
            sui-input(
                style='width:100%'
                name='tag'
                placeholder="Tag Name"
                :value="advancedForm.tag || ''"
                @input="tagInput")

        template(v-if='searchForm.type === "table"')
            .formLabel Reference ID
            .form
                // Reference
                sui-input(
                    style='width:100%'
                    name='reference'
                    placeholder="Referenced Record ID"
                    :value="advancedForm.reference || ''"
                    @input="e => advancedForm.reference = e.target.value")

        div(style='text-align:center;')
            sui-input.lineButton(type='reset' @click.prevent="advancedForm = advancedFormInit()")
            sui-input(style='margin: 8px .5em;width: 6em;' type='submit' value="Search")

</template>
<!-- script below -->
<script setup>
import { inject, reactive, ref, watch } from 'vue';
import { skapi } from '@/main';
import { useRoute, useRouter } from 'vue-router';

import SearchNavBar from '@/components/SearchNavBar.vue';
import Icon from '@/components/Icon.vue';

let route = useRoute();
let router = useRouter();
let serviceId = route.params.service;

function submitSearch(ev) {
    // using vue route instead of vanila get request to prevent browser refresh
    if(searchForm.type === 'user' && !searchForm.isAdvanced) {
        searchForm.isAdvanced = true;
        return false
    }
    let data = new FormData(ev.currentTarget);
    let queryParts = [];
    let entries = data.entries();
    for (let pair of entries) {
        queryParts.push(encodeURIComponent(pair[0]) + "=" + encodeURIComponent(pair[1]));
    }
    let query = queryParts.join("&");
    let url = `/admin/${serviceId}/records/search?${query}`;
    router.push(url);
    searchForm.isAdvanced = false;
}
const advancedFormEl = ref(null);

const setBodyHeight = () => {
    let neededHeight = window.pageYOffset + advancedFormEl.value?.getBoundingClientRect().top + advancedFormEl.value.offsetHeight;
    if(document.querySelector('.servicePageShell').offsetHeight < neededHeight) {
        document.querySelector('.servicePageShell').style.height = neededHeight + 20 + 'px';
        window.removeEventListener('scroll', setBodyHeight, true);
    }
}

const openAdvancedForm = async () => {
    if(searchForm.type === 'record') {
        searchForm.isAdvanced = false;
    } else if(searchForm.isAdvanced) {
        searchForm.isAdvanced = false;
        document.querySelector('.servicePageShell').style.height = null;
    } else {
        searchForm.isAdvanced = true;
        window.addEventListener('scroll', setBodyHeight, true);
    }
}

const tagInput = (e) => {
    if(!(/[`!@#$%^&*()_+\-=\[\]{};':"\\|,<>\/?~\[ \]]/).test(e.target.value)) {
        e.target.setCustomValidity('');
        advancedForm.tag = e.target.value;
    } else {
        e.target.setCustomValidity('No special characters are allowed');
    }

}

////////////////////////////////////////////////////////////////////
// search part
let searchForm = reactive({
    type: 'table',
    value: '',
    isAdvanced: false
});

let indexValueFormElement = ref(null);
function focusMe(e) {
    e.target.focus();
}
function advancedFormInit() {
    // return fresh object
    return {
        access_group: 0,
        table: undefined,
        subscription: null,
        index_type: 'string',
        index_name: undefined,
        index_name: undefined,
        index_value: undefined,
        index_condition: '=',
        tag: undefined,
        reference: undefined
    };
}

let advancedForm = ref(advancedFormInit());

function parseIndexType(value) {
    advancedForm.value.index_value = {
        'string': v => v ? v.toString() : undefined,
        'boolean': () => {
            advancedForm.value.index_condition = '=';
            // value is already set from radio, else set to false if not boolean
            if(value !== "false" && advancedForm.value.index_value !== false) {
                return true;
            }
            return false;
        },
        'number': v => v === '' ? undefined : isNaN(Number(v)) ? undefined : Number(v)
    }[advancedForm.value.index_type](value || indexValueFormElement.value?.el.value);

    return advancedForm.value.index_value;
}

// flag
let fetchingData = inject('fetchingData');

// data
let searchResult = inject('searchResult');

function search(searchParams) {
    // search query
    let params = {
        service: serviceId,
        table: {}
    };

    let type = searchParams['search_type'];
    if (!searchParams[type === 'table' ? 'table' : type === 'user' ? 'reference' : 'record_id']) {
        return router.replace('records');
    }
    for (let k in searchParams) {
        // ignore empty values
        if (!searchParams[k]) {
            continue;
        }

        let value = searchParams[k];
        switch (k) {
            case 'search_type':
                searchForm.type = value;
                break;

            case 'access_group':
                let access_group = value === 'private' ? 'private' : Number(value);
                params.table.access_group = access_group;
                advancedForm.value[k] = access_group;
                break;

            case 'index_name':
                if (!params?.index) {
                    params.index = {};
                };
                advancedForm.value[k] = value;
                params.index.name = value;
                break;

            case 'index_type':
                if (searchParams.index_value) {
                    advancedForm.value.index_type = searchParams.index_type;
                }
                break;

            case 'index_value':
                if (!params?.index) {
                    params.index = {};
                };
                params.index.value = parseIndexType(value);
                break;

            case 'index_condition':
                if (!searchParams.index_name) {
                    break;
                }
                if (!params?.index) {
                    params.index = {};
                }
                advancedForm.value[k] = value;
                params.index.condition = value;
                break;

            default:
                let main_search = searchForm.type === 'table' ? 'table' : searchForm.type === 'user' ? 'reference' : 'record_id';
                if (k === main_search) {
                    searchForm.value = value;
                    if (searchForm.type === 'user') {
                        if (searchParams?.subscription) {
                            let val = JSON.parse(searchParams?.subscription);
                            advancedForm.value.subscription = val;
                            if (val === null) {
                                params[k] = value;
                            }
                            else {
                                params.table.subscription = {
                                    user_id: value.trim(),
                                    group: val ? 1 : 0
                                };
                            }
                        } else {
                            params[k] = value;
                        }
                    }
                    else {
                        if (k === 'table') {
                            advancedForm.value[k] = value.trim();
                            params.table.name = value.trim();
                        } else if (k === 'record_id') {
                            advancedForm.value[k] = value.trim();
                            params.record_id = value.trim();
                        } else {
                            params[k] = value;
                        }
                    }
                }
                else if (k !== 'subscription') {
                    advancedForm.value[k] = value;
                    if(k === 'table') {
                        params.table.name = value;
                    } else {
                        params[k] = value;
                    }
                }
        }
    }

    fetchingData.value = true;
    searchResult.value = null;

    skapi.getRecords(params, { limit: 50 })
        .then(r => {
            searchResult.value = r;
            searchResult.value.params = params;
            fetchingData.value = false;
        }).catch(err => {
            fetchingData.value = false;
            searchResult.value = {
                endOfList: true,
                list: []
            };
            throw err;
        });
}

watch(() => route.query, n => {
    if (route.name === 'recordSearch') {
        search(n);
    }
    else if (route.name === 'records') {
        advancedForm.value = advancedFormInit();
        searchForm.value = '';
    }
}, {
    immediate: true
});
</script>

<style lang="less" scoped>
@import '@/assets/variables.less';

form {
    display: block;
    width: 100%;

    .mobile-search-type {
        width: 100%;
        padding: 8px var(--side-padding);

        sui-select {
            width: 100%;
            background: rgba(255, 255, 255, 0.08);
            border: 0.5px solid #8C8C8C;
            box-shadow: inset -1px -1px 2px rgb(0 0 0 / 25%), inset 1px 1px 2px rgb(255 255 255 / 65%);
        }
    }

    .select-input.isMobile {
        width: 100% !important;
        margin: 0px;
        background: none;
        display: block;
        box-shadow: none;
        border-radius: 0;

        &>*:first-child::after {
            display: none;
        }
    }

    .input-field.search {
        display: flex;
        flex-grow: 1;
        align-items: center;
    }

    .lineButton {
        margin: 8px .5em;
    }

    .toggle-advanced-form {
        user-select: none;
        display: flex;
        align-items: center;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        padding: 8px var(--side-padding);

        hr {
            flex-grow: 1;
            border: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.6);
            margin-right: 16px;
        }

        span {
            margin-right: 12px;
        }
    }

    .advanced-form {
        margin-top: 1em;
        padding: 0 20px;

        @media @phone {
            padding: 0 16px;
        }

        .formLabel {
            font-weight: 700;
        }

        .form,
        .formLabel {
            margin: 8px 0;
        }

        .form {
            margin-bottom: 32px;

            &>sui-input:not([type='radio']) {
                background-color: rgba(255, 255, 255, 0.08);
            }
        }

        .labelRadio {
            display: inline-flex;
            align-items: center;

            &:not(:last-child) {
                margin-right: 1.5em;
                margin-bottom: 4px;
            }

            &>* {
                vertical-align: middle;
            }

            &>label {
                padding-right: 0.5em;
            }
        }

        sui-select {
            width: 100%;
            background: rgba(255, 255, 255, 0.08);
            border: 0.5px solid #8C8C8C;
            box-shadow: inset -1px -1px 2px rgb(0 0 0 / 25%), inset 1px 1px 2px rgb(255 255 255 / 65%);
        }
    }
}

.placeholderIcon {
    color: #fff;
    flex-shrink: 0;
}

.option-button {
    flex-shrink: 0;
    margin-right: 12px;
    color: rgba(255, 255, 255, .6);
}

.select-input {

    &>.select-field {
    display: inline-block;
    position: relative;
    }

    &>*:first-child {
    &::after {
        content: '';
        display: inline-block;
        width: 1px;
        height: 1em;
        vertical-align: middle;
        background-color: rgba(255, 255, 255, .2);
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
    }
    }

    &>.select-field {
    sui-select {
        width: 8em;
        box-shadow: none;
        border: 0;
        background: transparent;
        vertical-align: middle;
    }
    }
}
input {
    -webkit-appearance: none;
}
</style>