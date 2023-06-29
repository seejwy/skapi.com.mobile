<template lang="pug">
sui-button(type="submit" :disabled="(props.loading || props.disabled) || null" :loading="props.loading || null" )  
	LoadingCircle(v-if="props.loading" :style="{'--bgColor': props.backgroundColor}")
	span(:style="{'visibility': props.loading ? 'hidden' : 'visible'}")
		slot
	input(type="submit" style="position: absolute; opacity: 0; visibility: hidden" :disabled="(props.loading || props.disabled) || null")
</template>
<script setup>
import LoadingCircle from './LoadingCircle.vue';

const props = defineProps({
	loading: {
		type: Boolean,
		default() {
			return false;
		}
	},
	disabled: {
		type: Boolean,
		default() {
			return false;
		}
	},
	backgroundColor: {
		type: String,
		default() {
			return '41, 63, 230';
		}
	}
})
</script>
<style lang="less" scoped>
sui-button {
	width: auto;

	&[loading] {
		filter: none;
		opacity: 1 !important;
	}
}
</style>