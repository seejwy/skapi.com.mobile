<template lang="pug">
sui-textarea(@keydown="keydownHandler" @change="keypressHandler")
	slot
</template>
<script setup>
const emit = defineEmits(['change']);
const keydownHandler = (e) => {
	if(e.key === 'Tab') {
		e.preventDefault();
		let position = e.target.selectionStart + 1;
		e.target.value = [e.target.value.slice(0, e.target.selectionStart),' ',e.target.value.slice(e.target.selectionStart)].join('');
		e.target.setSelectionRange(position, position);
	}
}

const keypressHandler = (e) => {
	emit('change', e);
}

</script>
<style lang="less" scoped>
@import '@/assets/variables.less';
sui-textarea {
	margin-top: 20px;
    padding: 16px 20px;
    background: #434343;
    border-radius: 8px;
    white-space: pre;
    height: auto;
    width: 100%;
    box-shadow: none;

	&:focus-within {
		outline: 2px solid var(--dark-highlight-color);
	}
}
</style>