<template lang="pug">
NavBarProxy
	template(v-slot:leftButton)
		Icon.clickable.backButton(@click="backHandler") left
	template(v-slot:title)
		div {{ route.query.id }}
	template(v-slot:rightButton)
		div(v-if="!isEdit" style="font-weight: bold; cursor: pointer" @click="editRecord") Edit      
		div(style="position: relative; width: 28px; height: 28px;" v-else-if="isSaving")
			LoadingCircle(style="--bgColor: 80, 80, 80; --ringColor: 250, 250, 250;")
		span(v-else @click="save" style="font-weight: bold; cursor: pointer") Save
.container(v-if="!isEdit && props.record?.record_id")
	.head
		.title
		.menu
			ul
				li.menuItem(@click="view = 'information'" :class="{'active': view === 'information'}") Information
				li.menuItem(@click="view = 'record'" :class="{'active': view === 'record'}") Data
			.action
				Icon(@click="() => deleteConfirmOverlay.open()") trash
	.content
		.grid(v-if="view === 'information'")
			.grid-item.title Record ID
			.grid-item {{ props.record.record_id }}
			.grid-item.title Table Name
			.grid-item {{ props.record.table.name }}
			.grid-item.title Access Group
			.grid-item {{ props.record.table.access_group === 'private' ? 'Private' : props.record.table.access_group ? 'Registered' : 'Public' }}
			.grid-item.title User ID
			.grid-item {{ props.record.user_id }}
			.grid-item.title Subscription
			.grid-item {{ props.record.table.subscription?.group || '-' }}
			.grid-item.title Reference 
			.grid-item {{ props.record.reference?.record_id || '-' }}
			.grid-item.title.span-2 Index
			.grid-item.title(style="font-weight: normal") Index Name
			.grid-item {{ props.record?.index?.name || '-' }}
			.grid-item.title(style="font-weight: normal") Index Value
			.grid-item
				span.type(v-if="props.record.index && props.record.index.hasOwnProperty('value')") {{ typeof props.record.index.value }}
				span {{ props.record.index && props.record.index.hasOwnProperty('value') ? props.record.index.value : '-' }}
			.grid-item.title Upload Datetime
			.grid-item {{ dateFormat(props.record.uploaded) }}
			.grid-item.title Reference
			.grid-item
				template(v-if="props.record.reference?.reference_limit === 0")
					.sub-grid Disabled
				template(v-else)
					.sub-grid Multiple Reference : {{props.record.reference?.allow_multiple_reference ? 'Allowed' : 'Not Allowed'}}
					.sub-grid Reference Limit : {{ (typeof props.record.reference?.reference_limit === 'number') ? props.record.reference?.reference_limit : 'Infinite' }}
			template(v-if="props.record.tags?.length")
				.grid-item.title.span-2 Tags
				.grid-item.span-2(style="padding-top: 4px;")
					.tags-wrapper
						.tag(v-for="tag in props.record?.tags") {{ tag }}
			template(v-else)
				.grid-item.title Tags
				.grid-item -

			// private_access temporarily removed. will be brought back with better scalable structure
			//- template(v-if="props.record.config?.private_access?.length")
			//- 	.grid-item.title.span-2 Access
			//- 	.grid-item.span-2(style="padding-top: 4px;")
			//- 		.tags-wrapper
			//- 			.tag(v-for="userId in props.record.config?.private_access") {{ userId }}
			//- template(v-else)
			//- 	.grid-item.title Access
			//- 	.grid-item -
		template(v-else-if="view === 'record'")
			template(v-if="props.record.data")
				template(v-for="(record, key) in props.record.data")
					template(v-for="record in getDataByTypes(record)")
						template(v-if="record.files.length")
							.data-row
								.name
									span.type File
									span {{ key }}
									template(v-if="props.record.table.access_group === 0")
										a.value.file(v-for="file in record.files" :href="file.url" style="text-decoration: none;color: unset;")
											Icon attached
											span
												.filename {{ file.filename }}
												div(v-if="file.size" style="font-size: 12px;") {{ getSize(file.size) }}
											Icon download
									template(v-else)
										a.value.file(v-for="file in record.files" @click="download(file.url, file?.filename)" style="text-decoration: none;color: unset; cursor: pointer;")
											Icon attached
											span
												.filename {{ file.filename }}
												div(v-if="file.size" style="font-size: 12px;") {{ getSize(file.size) }}
											Icon download
								.data-row(v-for="value in record.json")
									.name
										span.type(v-if="typeof value === 'object'") JSON
										span.type(v-else) {{ typeof value }}
										span {{ key }}

									.value(v-if="value === null") null
									.value(v-else) {{ value }}
						.data-row(v-else-if="record.json !== undefined")
							.name
								span.type JSON
								span {{ key }}
							.value(v-if="record.json === null") null
							pre.value(v-else) {{ record.json }}
						.data-row(v-else)
							.name
								span.type {{ typeof record.primitive }}
								span {{ key }}

							.value.empty-string(v-if="typeof record.primitive === 'string' && record.primitive === ''") empty string
							.value(v-else) {{ record.primitive }}
			.no-data(v-else)
				Icon(style="height: 72px; width: 72px;") no_record
				p No Data
.container(v-else-if="isEdit" :loading="isSaving || null")
	form(ref="formConfig")
		.head
			.title 
			.menu
				ul
					li.menuItem(@click="() => view = 'information'" :class="{'active': view === 'information'}") Setting
					li.menuItem(@click="() => view = 'record'" :class="{'active': view === 'record'}") Data

		.content#setting(v-show="view === 'information'")
			.row
				.section(style="width: 100%;")
					.name Table Name
					sui-input(
						required 
						:value="form.table.name" 
						@input="(e) => {validateTableName(e); form.table.name = e.target.value; }" 
					)

			.row
				.section.mobile-full
					.name 
						span Reference ID
						sui-tooltip
							Icon(slot="tool") question
							div(slot="tip") Please provide a valid Record ID to establish a reference to another record. Each record can only reference one other record, but multiple references to a single record are permitted. Reference permissions are managed in your record's settings.

					sui-input(ref="referenceIdField" :value="form.reference?.record_id || ''" pattern="[0-9a-zA-Z]+" @input="(e) => { form.reference.record_id = e.target.value; e.target.setCustomValidity(''); }")
				.section.mobile-full
					.name Access Group
					sui-select(:value="form.table.access_group.toString()" @change="(e) => form.table.access_group = e.target.value" style="min-width: 160px;")
						option(value="0") Public 
						option(value="1") Registered

			.row
				.section(style="width: 100%;")
					.name Tags 
					TagsInput(:value="form.tags" @change="(value) => form.tags = value" :disabled="isSaving")

			.row
				.section(style="width: 100%;")
					.name Index Name 
					sui-input(
						ref="indexNameField"
						:required="form.index.value !== '' ? true : null"
						:value="form.index.name"
						pattern="[a-zA-Z0-9.]+"
						@input="(e)=> {form.index.name = e.target.value; e.target.setCustomValidity('')}"
						@invalid="(e) => e.target.setCustomValidity('Index name must not have spaces or special characters')"
						)

			.row
				.section
					.name Index Value
					.row(style="row-gap: 16px; display: block;")
						sui-select(style="width: 110px; margin-right: 24px; vertical-align: middle;" index-type :value="indexValueType" @change="(e) => { indexValueType = e.target.value; form.index.value = indexValueType === 'boolean' ? true : ''; indexNameField.children[0].setCustomValidity('') }")
							option(disabled) Value Type
							option(value="string") String
							option(value="number") Number
							option(value="boolean") Boolean
						.section(style="width: calc(100% - 134px);")
							.radio-container(v-if="indexValueType === 'boolean'")
								label True
									sui-input(@change="form.index.value = true" type="radio" :checked="form.index.value === true || null" name="index_value")
								label False
									sui-input(@change="form.index.value = false" type="radio" :checked="form.index.value === false || null" name="index_value")
							sui-input(
								v-else
								:type="indexValueType === 'number' ? 'number' : 'text'"
								:required="form.index.name !== '' ? true : null"
								:value="form.index.value"
								pattern="[a-zA-Z0-9' ']+"
								@invalid="(e) => e.target.setCustomValidity('Index value must not have special characters')"
								@input="(e)=> { form.index.value = e.target.value; e.target.setCustomValidity(''); !e.target.value ? indexNameField.children[0].setCustomValidity('') : null; }")

			.row
				.section
					.name(style="display: flex; align-items: center;")
						label
							sui-input(
								type="checkbox" 
								style="margin-right: 8px;"
								@change="e=>form.reference.reference_limit = e.target.checked ? null : 0"
								:checked="form.reference?.reference_limit !== 0 ? true : null")

							span Allow Reference

					// reference not allowed when if reference_limit is 0
					.reference-container(v-if="form.reference.reference_limit !== 0")
						label
							span Allow Multiple Reference
							sui-input#allow_multiple_reference(
								style="margin-left: 8px"
								type="checkbox"
								@input="(e)=>form.reference.allow_multiple_reference = e.target.checked"
								:checked="form.reference.allow_multiple_reference ? true : null")
						label
							span Reference Limit:
							input.line-input(
								type="number"
								min="1"
								placeholder="Infinite"
								:value="form.reference.reference_limit === null ? '' : (form.reference?.reference_limit || '').toString()"
								@input="(e) => form.reference.reference_limit = e.target.value ? parseInt(e.target.value) : null")

			// private_access temporarily removed. will be brought back with better scalable structure
			//- .row
			//- 	.section(style="width: 100%;")
			//- 		.name Access 
			//- 		TagsInput(:value="form.private_access" @change="(value) => form.private_access = value")

	form(ref="formEl")
		.content#record(v-show="view === 'record'")
			.data-row(v-for="(record, recordIndex) in data")
				.data-name-action
					.select-input
						.select-field
							sui-select(:value="record.type" @change="(e) => record.type = e.target.value")
								option(disabled) Value Type
								option(value="string") String
								option(value="number") Number
								option(value="boolean") Boolean
								option(value="file") File
								option(value="json") JSON
						.input-field
							sui-input(type="text" :value="record.key" placeholder="Key Name" @input="(e) => record.key = e.target.value" required)
					.action
						sui-button.icon-button(type="button" @click="removeField(recordIndex)")
							Icon trash
				.data-values
					template(v-if="record.type === 'file'")
						.file-upload-area(@dragenter.stop.prevent="" @dragover.stop.prevent="" @drop.stop.prevent="e=>onDrop(e, recordIndex)" @click="openFileInput")
							input(hidden :file-key="record.key" type="file" @change="e=>addFiles(e, recordIndex, index)" multiple :disabled="isSaving")
							div
								Icon attached
								span.hideOnTablet(style="margin-right: 6px;") Drag and Drop OR
								sui-button.lineButton(@click.prevent.stop="" type="button") Upload
							.error(v-if="fileError === record.key && record.key !== ''" style="display: block; text-align: center;") 
								Icon warning
								span You must upload a file
						.file-size-limit The total size per upload must be less than {{fileSizeLimit}} MB
						template(v-for="(file, index) in record.data")
							.value.file(v-if="file.md5 || file.lastModified")
								Icon attached
								span
									.filename {{ file.name || file.filename }}
									div(v-if="file.size" style="font-size: 12px;") {{ getSize(file.size) }}
								Icon.remove(@click="() => { isSaving ? null : record.data.splice(index, 1); }") X
					template(v-else-if="record.type === 'json'")
						JsonInput(
							placeholder="Key Value"
							spellcheck="false"
							@input="e => { record.data = e.target.value; e.target.setCustomValidity('')}"
							@change="validateJson"
							:disabled="isSaving"
							required) {{ record.data }}

					.data-input-field.transparent.boolean(v-else-if="record.type === 'boolean'")
						div Value:
						div
							label
								span True
								sui-input(type="radio" :name="record.key" value="true" :checked="record.data !== false ? true : null")
						div
							label 
								span False
								sui-input(type="radio" :name="record.key" value="false" :checked="record.data === false ? true : null")

					sui-input.data-input-field(v-else-if="record.type === 'number'" style="height: auto;" required placeholder="Key Value" type='number' :name="record.key" :value="record.data.toString()")

					sui-input.data-input-field(v-else type="text" style="height: auto;" :name="record.key" spellcheck="false" placeholder="Key Value" :value="record.data.toString()") {{  record.data  }}

			div
				sui-button.lineButton(type="button" style="width: 100%;" @click.prevent="addField") Add Data

sui-overlay(ref="deleteConfirmOverlay")
	.popup
		.title
			Icon warning
			div Are you sure?
		.body Are you sure you want to delete the record?
		.foot
			sui-button.textButton(type="button" @click="()=>deleteConfirmOverlay.close()") No 
			sui-button.textButton(type="button" @click="deleteRecord") Yes
sui-overlay(ref="exitEditOverlay")
	.popup
		.title
			Icon warning
			div Are you sure?
		.body Are you sure you want to close? You are still editing.
		.foot
			sui-button.textButton(type="button" @click="()=>exitEditOverlay.close()") No 
			sui-button.textButton(type="button" @click="confirmClose") Yes
sui-overlay(ref="filesizeExceedsOverlay")
	.popup
		.title
			Icon warning
			div File Size Exceeded
		.body Your total file size exceeds {{ fileSizeLimit }}MB.
		.foot
			sui-button.lineButton(type="button" @click="()=>filesizeExceedsOverlay.close()") OK
</template>
<script setup>
import { ref, nextTick, inject, onMounted } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import { skapi, state } from '@/main';
import { dateFormat, getSize } from '@/helper/common';
import { tableList, getMoreRecords, recordTables, refreshTables } from '@/helper/records';
import NavBarProxy from '@/components/NavBarProxy.vue';
import TagsInput from '@/components/TagsInput.vue';
import JsonInput from '@/components/JsonInput.vue';
import Icon from '@/components/Icon.vue';
import LoadingCircle from '@/components/LoadingCircle.vue';

const route = useRoute();
const router = useRouter();
const appStyle = inject('appStyle');
const props = defineProps(['record']);
const emit = defineEmits(['close']);
const deleteConfirmOverlay = ref(null);
const filesizeExceedsOverlay = ref(null);
const exitEditOverlay = ref(null);
const searchResult = inject('searchResult');

const serviceId = route.params.service;
const view = ref('information');
const isEdit = ref(false);
const isSaving = ref(false);
const formConfig = ref(null);
const formEl = ref(null);
const referenceIdField = ref(null);
const indexNameField = ref(null);
const form = ref({});
const data = ref([]);
const indexValueType = ref('string');
const fileError = ref('');
let isNewRecord = false;
const fileSizeLimit = navigator?.userAgentData?.platform === 'Windows' || navigator?.oscpu?.includes('Windows') ? 3.9 : 4;

const currentTotalFileSize = ref(0);

const backHandler = () => {
    // if search page, go back to search page
    if(router.options.history.state.back) {
        let url = new URLSearchParams(router.options.history.state.back.substring(router.options.history.state.back.indexOf('?')))
        if(url.has('table')) {
            router.go(-1);
        } else {
            router.push({name: 'records'});
        }
    } else {
		if(props.record.table) {
			router.push(`/admin/${serviceId}/records/list?table=${props.record.table.name}`);
		} else {
            router.push({name: 'records'});
		}
    }
}

const editRecord = () => {
	if (!props?.record) {
		return;
	}
	indexValueType.value = props.record?.index?.value !== '' && props.record?.index?.value !== undefined ? typeof props.record?.index?.value : 'string';
	isNewRecord = !props.record?.record_id;

	data.value = [];
	let record = JSON.parse(JSON.stringify(props.record));
	form.value = {};

	for (let k of [
		'record_id',
		// 'access_group',
		'table',
		// 'subscription_group', (not for admin)
		'reference',
		'index',
		'tags'
	]) {
		if (record.hasOwnProperty(k)) {
			form.value[k] = record[k];

			// if (k === 'config') {
			// 	if (!record.config.hasOwnProperty('reference_limit')) {
			// 		form.value.config.reference_limit = null;
			// 	}
			// }
		}

		else {
			// set default values
			switch (k) {
				case 'index':
					form.value.index = {
						name: '',
						value: ''
					};
					break;
				case 'table':
					form.value.table = {
						access_group: 0,
						name: ''
					};
					break;
				case 'record_id':
				case 'tags':
					// do nothing
					break;
				case 'reference':
					form.value.reference = {
						record_id: null,
						reference_limit: null,
						allow_multiple_reference: true
					};
					break;
				default:
					form.value[k] = '';
					break;
			}
		}
	}

	if (record?.data) {
		let recordData = record.data;
		for (let key in recordData) {
			let typeSplitFiles = getDataByTypes(recordData[key]).data;
			if (typeSplitFiles.files.length) {
				data.value.push({ key, type: 'file', data: typeSplitFiles.files });
			}

			if (typeSplitFiles.json) {
				if (Array.isArray(typeSplitFiles.json)) {
					typeSplitFiles.json.forEach(value => {
						if (Array.isArray(value)) {
							data.value.push({ key, type: 'json', data: JSON.stringify(value) });
						} else {
							data.value.push({ key, type: typeof value === "object" ? 'json' : typeof value, data: value === null ? JSON.stringify(value) : value });
						}
					});
				} else {
					data.value.push({ key, type: 'json', data: typeSplitFiles.json === null ? JSON.stringify(typeSplitFiles.json) : JSON.stringify(typeSplitFiles.json, null, " ") });
				}
			} else {
				if (typeSplitFiles.primitive !== null) {
					data.value.push({ key, type: typeof typeSplitFiles.primitive, data: typeSplitFiles.primitive });
				} else if (typeSplitFiles.json) {
					data.value.push({ key, type: 'json', data: JSON.stringify(typeSplitFiles.json, null, 2) });
				}
			}
		}
	}

	isEdit.value = true;
};

const deleteRecord = () => {
	let table, tableIndex;

	if (recordTables.value) {
		table = recordTables.value.list.find((val) => val.table === props.record.table.name);
		if (table) {
			if (table.records?.list) {
				tableIndex = table.records.list.findIndex((record) => record.record_id === props.record.record_id);
			} else {
				tableIndex = table.records.value.list.findIndex((record) => record.record_id === props.record.record_id);
			}
		}
	} else if (searchResult.value) {
		tableIndex = searchResult.value.list.findIndex((val) => {
			return val.record_id === props.record.record_id;
		});
	}

	if (recordTables.value && !searchResult.value) {
		table.records.list[tableIndex].deleting = true;

		skapi.deleteRecords({
			service: serviceId,
			record_id: [props.record.record_id]
		}).then(() => {
			table.number_of_records--;
			table.records.list.splice(tableIndex, 1);
			if (table.records.list.length === 0) {
				let indexToDelete = recordTables.value.list.findIndex(t => {
					return t.table.toString() === table.table;
				});

				if (indexToDelete >= 0) {
					recordTables.value.list.splice(indexToDelete, 1);
				}
			}
		}).catch((e) => {
			console.log({ e });
			delete table.records.list[tableIndex].deleting;
		});
	} else {
		if (searchResult.value && searchResult.value.list.length) searchResult.value.list[tableIndex].deleting = true;

		skapi.deleteRecords({
			service: serviceId,
			record_id: [props.record.record_id]
		}).then(() => {
			if (searchResult.value) searchResult.value.list.splice(tableIndex, 1);
			if (recordTables.value) table.number_of_records--;
		}).catch((e) => {
			console.log({ e });
		});
	}

	deleteConfirmOverlay.value.close();
	router.push(`/admin/${serviceId}/records/list?table=${props.record.table.name}`);

	view.value = 'information';
}

const saveData = async () => {
	try {
		let res = await save();
		if (res) {
			router.replace({
				name: 'mobileRecordView',
				query: {
					id: res.record_id
				}
			});

			return res;
		} else {
			return false;
		}
	} catch (e) {
		console.log({ e });
		fileError.value = e.message;

		if (e.code === 'NOT_EXISTS') {
			view.value = 'information';
			await nextTick();
			referenceIdField.value.querySelector('input').setCustomValidity('Reference ID is invalid');
			referenceIdField.value.querySelector('input').reportValidity();
		}
		if (e?.name === 'NO_FILE') {
			fileError.value = e.message;
		}
	}
}

const save = async () => {
	isSaving.value = true;

	if (view.value === 'record') {
		formEl.value.reportValidity();
		if (formEl.value.checkValidity()) {
			view.value = 'information';
			await nextTick();
			formConfig.value.reportValidity();
			if (!formConfig.value.checkValidity()) {
				isSaving.value = false;
				return false;
			}

			view.value = 'record';
		} else {
			isSaving.value = false;
			return false;
		}
	} else {
		formConfig.value.reportValidity();
		if (formConfig.value.checkValidity()) {
			view.value = 'record';
			await nextTick();
			formEl.value.reportValidity();
			if (!formEl.value.checkValidity()) {
				isSaving.value = false;
				return false;
			}

			view.value = 'information';
		} else {
			isSaving.value = false;
			return false;
		}
	}

	let config = Object.assign({}, form.value, {
		service: serviceId,
		formData: form => {
			data.value.forEach(record => {
				if (record.type === 'json') {
					if (typeof record.data !== 'string' && !isNaN(record.data)) {
						record.data = JSON.stringify(record.data);
					}
					record.data = record.data.replaceAll(' ', '');
					form.append(record.key, new Blob([record.data], {
						type: 'application/json'
					}));
				} else if (record.type === 'file') {
					if (record.data.length) {
						record.data.forEach(file => {
							if (file instanceof File) {
								form.append(record.key, file);
							} else {
								form.append(record.key, new Blob([JSON.stringify(file)], {
									type: 'application/json'
								}));
							}
						});
					} else {
						function NoFileError(key) {
							this.name = 'NO_FILE';
							this.message = key;
						}

						NoFileError.prototype = Error.prototype;

						throw new NoFileError(record.key);
					}
				}
			});
			return form;
		}
	});

	if (!config.index?.name) {
		config.index = null; // set to null to remove index
	} else {
		config.index.value = (() => {
			let value = config.index.value;
			switch (document.querySelector('sui-select[index-type]').value) {
				case 'number':
					value = Number(value);
					break;
				case 'boolean':
					value = value === true;
					break;
			}

			return value;
		})();
	}

	config.table.access_group = Number(config.table.access_group);

	try {
		let currentTable = props.record?.table?.name;
		state.blockingPromise = skapi.postRecord(Object.keys(data.value).length ? formEl.value : null, config);
		let r = await state.blockingPromise;

		if (isNewRecord) {
			if (tableList.includes(r.table.name)) {
				let idx = tableList.indexOf(r.table.name);
				let tbl = recordTables.value.list[idx];
				if (tbl) {
					tbl.number_of_records++;
					r.data = ref(r.data);

					if (tbl.records.startKey === 'end') {
						tbl.records.list.push(r);
					}
				}
			} else {
				if (recordTables.value?.endOfList) {
					let positionFound = false;
					let index = 0;
					while (!positionFound && index < recordTables.value.list.length) {
						if (index + 1 <= recordTables.value.list.length && r.table.name > recordTables.value.list[index].table && r.table.name < recordTables.value.list[index + 1]?.table) {
							recordTables.value.list.splice(index + 1, 0, {
								number_of_records: 1,
								opened: true,
								records: ref({ endOfList: true, startKey: 'end', startKey_list: ['end'], list: [r] }),
								service: serviceId,
								size: 0,
								table: r.table.name
							});
							positionFound = true;
						}
						index++;
					}

					if (!positionFound) {
						recordTables.value.list.push({
							number_of_records: 1,
							opened: true,
							records: ref({ endOfList: true, startKey: 'end', startKey_list: ['end'], list: [r] }),
							service: serviceId,
							size: 0,
							table: r.table.name
						});
						tableList.push(r.table.name);
					}
				}
			}

			isSaving.value = false;
			isEdit.value = false;

			router.replace({
				name: 'mobileRecordView',
				query: {
					id: r.record_id
				}
			});
		}
		else {
			for (let k in props.record) {
				if (!r.hasOwnProperty(k)) {
					delete props.record[k];
				}
			}
		}

		for (let k in r) {
			props.record[k] = r[k];
		}

		if (!isNewRecord && props.record?.table?.name !== currentTable) {
			await nextTick();
			recordTables.value.list.forEach((table, index) => {
				if (table.table === currentTable) {
					let idx = table.records.list.findIndex((record) => {
						return record.record_id === props.record_id
					});

					if (props.record.table.name !== currentTable) {
						recordTables.value.list.push({
							number_of_records: 1,
							opened: true,
							records: ref({ endOfList: true, startKey: 'end', startKey_list: ['end'], list: [r] }),
							size: 0,
							table: props.record.table.name
						});
					}

					table.records.list.splice(idx, 1);
					table.number_of_records--;
					if (table.number_of_records <= 0) {
						recordTables.value.list.splice(index, 1);
					}
				} else if (table.table === props.record.table.name) {
					table.number_of_records++;
					let idx = table.records.list.findIndex((record) => {
						return record.uploaded > props.record.uploaded
					});

					table.records.list.splice(idx, 0, r);
				} else {
					refreshTables(serviceId);
				}
			});
		}

		isSaving.value = false;
		isEdit.value = false;
		return r;
	} catch (e) {
		// do some error message
		console.log({ e });
		isSaving.value = false;
		throw e;
	};
};

const download = async (secureUrl, fileName) => {
	try {
		let download = await skapi.getBlob({ url: secureUrl }, { service: serviceId });
		let reader = new FileReader();
		reader.readAsDataURL(download);
		reader.onload = () => {
			const file = reader.result;
			let a = document.createElement('a');
			a.href = file;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}
	} catch (e) {
		console.log({ e });
	}
}

const onDrop = (event, keyIndex) => {
	event.preventDefault();
	if (isSaving.value) return false;

	const files = event.dataTransfer.files;
	let fileData = data.value[keyIndex].data || [];
	fileData = [...fileData, ...files];

	if (checkFileSize(event, fileData)) {
		data.value[keyIndex].data = fileData;
	}
};

const checkFileSize = (event, fileCollection) => {
	currentTotalFileSize.value = 0;

	data.value.forEach((key) => {
		if (key.type === 'file') {
			if (Array.isArray(key.data)) {
				key.data.forEach((file) => {
					if (file instanceof File) {
						currentTotalFileSize.value += file.size / 1000;
					}
				});
			}
		}
	});

	fileCollection.forEach((file) => {
		currentTotalFileSize.value += file.size / 1000;
	});

	if (currentTotalFileSize.value > 4000) {
		event.target.value = null;
		filesizeExceedsOverlay.value.open();

		return false;
	}

	return true;
}

const addFiles = (event, keyIndex, index) => {
	if (isSaving.value) return false;

	const files = event.target.files;
	let fileData = data.value[keyIndex].data;
	let fileCollection = [...files];

	if (checkFileSize(event, fileCollection)) {
		if (Array.isArray(fileData)) {
			fileCollection = [...fileData, ...fileCollection];
		} else {
			fileCollection = [...fileCollection];
		}
		data.value[keyIndex].data = fileCollection
		event.target.value = '';
		fileError.value = '';
	}
};

const addField = () => {
	data.value.push({ key: '', type: 'string', data: '' });
};

const removeField = (index) => {
	if (isSaving.value) return true;
	data.value.splice(index, 1);
};

const openFileInput = (event, index) => {
	const parent = event.target.closest('.file-upload-area');
	parent.querySelector('input[type="file"]').click();
};

const validateJson = (event) => {
	if (event.target.value === '') event.target.setCustomValidity('');
	try {
		let value = event.target.value.replaceAll(' ', '');
		JSON.parse(value);
		event.target.setCustomValidity('');
	} catch (e) {
		event.target.setCustomValidity('Invalid JSON');
		event.target.reportValidity();
	}
};

const validateTableName = (event) => {
	const regex = /^[\p{L}\d\s.]+$/u;

	let isValid = event.target.value.match(regex) ? true : false;
	if (isValid) event.target.setCustomValidity('');
	else {
		event.target.setCustomValidity('Table name cannot contain special characters other than period and spaces');
		event.target.reportValidity();
	}
};

const getDataByTypes = (record) => {
	let files = [];
	let json;
	let primitive = null;
	if (Array.isArray(record)) {
		let newArr = [];
		for (let key in record) {
			if (record[key]?.md5) {
				files.push(record[key]);
			} else {
				newArr.push(record[key]);
			}
		}

		json = newArr;
	} else if (typeof record === 'object') {
		if (record?.md5) {
			files.push(record);
		} else {
			json = record;
		}
	} else {
		primitive = record;
	}

	return { data: { files, json, primitive } };
};

const confirmClose = () => {
	exitEditOverlay.value.close();
	isEdit.value = false;
	emit('close');
};

let recordToOpen = inject('recordToOpen');

const close = () => {
	if (isEdit.value) {
		exitEditOverlay.value.open();
		return false;
	}
	isEdit.value = false;
	emit('close');
};

onMounted(() => {
	view.value = 'information';
})

defineExpose({
	close,
	editRecord,
	saveData
});
</script>
<style lang="less" scoped>
.container {
	background: #505050;
	position: relative;

	.head {
		background-color: #505050;

		.title {
			padding: 8px 0;
		}
	}

	.title {
		display: flex;
		justify-content: space-between;
		padding: 18px 20px 24px 20px;
		font-weight: bold;
	}

	.menu {
		display: flex;
		justify-content: space-between;
		font-weight: bold;

		ul {
			margin: 0;
			padding: 0;
		}

		&Item {
			display: inline-flex;
			align-items: center;
			height: 40px;
			padding: 0 20px;
			border-radius: 8px 8px 0px 0px;
			cursor: pointer;

			&.active {
				background-color: #333333;
			}
		}

		.action {
			display: inline-flex;
			align-items: center;
			gap: 4px;
			padding: 0 20px;
			cursor: pointer;
			color: #fff;

			svg {
				width: 20px;
				height: 20px;
			}
		}
	}

	.content {
		background-color: #333333;
		padding: 30px 20px 20px 20px;

		.grid {
			display: grid;
			grid-template-columns: auto 1fr;
			grid-template-rows: repeat(auto-fit);
			grid-column-gap: 20px;

			sui-input[type=checkbox],
			sui-input[type=checkbox][disabled] {
				filter: none;
				margin-left: 8px;
				border-color: rgba(255, 255, 255, 0.6);

				&[checked] {
					border: none;
					color: rgba(0, 0, 0, 0.5);
					background: rgba(255, 255, 255, 0.6);
					box-shadow: inset -1px -1px 2px rgba(0, 0, 0, 0.25);
				}
			}
		}

		.grid-item {
			grid-column: span 1;
			padding: 8px 0;

			&.span-2 {
				grid-column: span 2;
			}

			.sub-grid:not(:last-child) {
				margin-bottom: 12px;
			}

			&.title {
				font-weight: bold;
				color: rgba(255, 255, 255, .6);
			}
		}

		.data-row {
			margin-bottom: 72px;

			& .data-row:nth-child(2) {
				margin-top: 72px;

				&::before {
					content: '';
					display: block;
					position: relative;
					top: -36px;
					height: 2px;
					width: 100%;
					background-color: rgba(255, 255, 255, 0.08);
				}
			}

			& .data-row:last-child {
				margin-bottom: 0;
			}

			.action {
				float: right;
			}

			&:last-child {
				margin-bottom: 36px;
			}

			.data-input-field {
				width: 100%;
				box-shadow: none;

				& input:focus {
					outline: none;
				}
			}

			.data-input-field,
			.value {
				margin-top: 20px;
				padding: 16px 20px;
				background: #434343;
				border-radius: 8px;
				white-space: pre-wrap;
				word-break: break-word;

				&.empty-string {
					color: rgba(255, 255, 255, 0.4);
					font-style: italic;
				}

				&.file {
					display: flex;
					padding: 16px 20px 16px 12px;
					gap: 16px;

					.filename {
						margin-bottom: 8px;
					}

					span:first-child,
					span:last-child {
						color: rgba(255, 255, 255, .6);
					}

					svg:first-child {
						height: 46px;
						width: 46px;
					}

					span:nth-child(2) {
						flex-grow: 1;
					}

					svg {
						color: rgba(255, 255, 255, 0.6);
						align-self: center;
						flex-shrink: 0;

						&.remove {
							cursor: pointer;
							color: #fff;
						}
					}
				}

				sui-input {
					padding: 0;

					&:not([type=radio]) {
						width: 100%;
						box-shadow: none;

						& input:focus {
							outline: none;
						}
					}
				}

				&.transparent {
					background: none;
					padding: 0 20px;

				}

				&.boolean {
					display: flex;
					gap: 20px;

					label sui-input {
						margin-left: 8px;
						vertical-align: middle;
					}
				}

				&.boolean {
					display: flex;
					gap: 20px;

					label {
						margin-right: 8px;
					}
				}
			}

			&:not(:last-child)::after {
				content: '';
				display: block;
				position: relative;
				top: 36px;
				height: 2px;
				width: 100%;
				background-color: rgba(255, 255, 255, 0.08);
			}

			.data-name-action {
				display: flex;
				align-items: center;
				gap: 12px;

				.select-input {
					flex-grow: 1;
					text-align: left;
					box-shadow: none;

					.select-field::after {
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

					sui-select {
						width: 6.5em;
					}
				}

				.action {
					cursor: pointer;
					font-weight: bold;

					svg {
						width: 20px;
						height: 20px;
					}
				}
			}

			.file-upload-area {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				margin: 28px 0;
				border: 1px dashed #FFFFFF;
				border-radius: 8px;
				height: 100px;

				sui-button {
					vertical-align: middle;
				}

				&:only-child {
					margin-bottom: 0;
				}

				&>div>* {
					display: inline-block;

					&:first-child {
						margin-right: 6px;
					}

					&:last-child {
						margin-left: 6px;
					}
				}

				svg {
					height: 57px;
					width: 57px;
					color: rgba(255, 255, 255, .6);
				}

				.error {
					color: #FF8D3B;

					svg {
						height: 24px;
						width: 24px;
						fill: #FF8D3B;
					}
				}
			}

			.file-size-limit {
				text-align: center;
				font-size: 14px;
				margin: -20px 0 -5px 0;
				opacity: .6;
			}
		}

		.no-data {
			text-align: center;
			color: rgba(255, 255, 255, .4);
			font-size: 28px;
			margin-top: 65px;

			p {
				margin: 12px 0 0 0;
			}

			svg {
				width: 72px;
				height: 72px;
			}
		}

		.row {
			width: 100%;

			&:not(:last-child) {
				margin-bottom: 25px;
			}

			sui-select,
			sui-input:not([type=checkbox]):not([type=radio]) {
				width: 100%;
			}
		}

		.section {
			display: inline-block;
			vertical-align: middle;
			width: 100%;

			&.mobile-full {

				&:first-child {
					margin-bottom: 25px;
				}

				width: 100%;
			}

			.name {
				margin-bottom: 8px;
				font-weight: bold;

				sui-tooltip {
					float: right;
					vertical-align: middle;
					font-weight: normal;
				}
			}

			.reference-container {
				display: flex;
				flex-wrap: wrap;
				gap: 16px;
				padding: 12px;
				background: #434343;
				border-radius: 4px;

				label {
					display: flex;
					align-items: center;
					flex-basis: calc(50% - 16px);
					white-space: nowrap;
					flex-grow: 1;
				}
			}

			.radio-container {
				height: 100%;
				display: flex;
				align-items: center;
				gap: 24px;

				label {
					cursor: pointer;
				}

				sui-input {
					margin-left: 10px;
					vertical-align: middle;
				}
			}

			.line-input {
				background-color: transparent;
				color: #fff;
				border: none;
				border-radius: 0;
				border-bottom: 1px solid rgba(255, 255, 255, 0.6);
				width: 100%;
				margin-left: 8px;
				font-size: 16px;

				&:focus-within {
					outline: none;
				}
			}
		}
	}



	label {
		cursor: pointer;

		span {
			line-height: 1;
			vertical-align: middle;
		}
	}

	.foot {
		text-align: center;
		padding: 20px;

		sui-button[disabled] {
			filter: none;
			box-shadow: rgb(255 255 255 / 50%) 1px 1px 2px inset, rgb(0 0 0 / 25%) -1px -1px 2px inset, rgb(0 0 0 / 25%) 0px 0px 0px 1px inset;
		}
	}

	.tags-wrapper {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		background: #434343;
		border-radius: 4px;
		padding: 12px 16px;

		.tag {
			display: inline-block;
			padding: 4px 8px;
			background: #D9D9D9;
			color: rgba(0, 0, 0, 0.65);
			border: 0.5px solid #8C8C8C;
			box-shadow: inset -1px -1px 2px rgba(0, 0, 0, 0.25), inset 1px 1px 2px rgba(255, 255, 255, 0.65);
			border-radius: 4px;
		}
	}
}

.type {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-right: 12px;
	text-transform: capitalize;
	border: 1px solid #FFFFFF;
	border-radius: 4px;
	height: 28px;
	font-size: 14px;
	padding: 0 8px;
	min-width: 72px;
}
</style>