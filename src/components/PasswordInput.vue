<template lang="pug">
.sui-input
	sui-input(ref="field" :type="type" @input="$emit('input', $event)" @change="$emit('change', $event)" :value="props.value" :placeholder="props.placeholder" :disabled="disabled || null" :required="required || null" :autocomplete="props.autocomplete")
	Icon(v-if="type !== 'password'" @click="type = 'password'") eye_open
	Icon(v-else @click="type = 'text'") eye_close
</template>
<script setup>
import { ref } from 'vue';
import Icon from './Icon.vue';

const props = defineProps(['value', 'placeholder', 'required', 'autocomplete', 'disabled']);
const type = ref('password');
const field = ref(null);

const setError = (msg) => {
	field.value.firstChild.setCustomValidity(msg);
	field.value.firstChild.reportValidity();
}

const clearError = () => {
	field.value.firstChild.setCustomValidity('');
}

defineExpose({
	clearError,
	setError
})
</script>
<style lang="less" scoped>
@import '@/assets/variables.less';
.sui-input {
	position: relative;
}
sui-input {
	width: 100%;
}
svg {
	position: absolute;
	fill: rgba(28, 27, 31, 0.25);
	width: 24px;
	height: 24px;
	vertical-align: middle;
	cursor: pointer;
	right: 17px;
	top: 50%;
	transform: translateY(-50%);
}
::-ms-reveal {
	display: none;
}
</style>