<template lang="pug">
input(type="hidden" :value="tagArray?.join(',')")
.tag-container(@click="focusEl" :disabled="props.disabled")
  span.tag(v-for="(tag, index) in tagArray" @click.stop="")
    span {{ tag }}
    Icon(@click="removeTag(index)") X
    //- do not remove the extra space in .tag-input
  .tag-input(v-if="!props.disabled" ref="input" contenteditable="true" tabindex="0" @keydown.enter.space.prevent="addTag" @input="addTag" @keydown.delete="deleteTag" @blur="addTag")  
.error(v-if="inputError")
  Icon warning
  span  No special characters are allowed
</template>
<script setup>
import { reactive, ref } from 'vue';
import Icon from './Icon.vue';

const props = defineProps(['value', 'disabled']);
const emits = defineEmits(['change']);
const inputError = ref(false);
let tagArray = ref([]);

if(props.value) {
  tagArray.value = JSON.parse(JSON.stringify(props.value));
}

const input = ref(null);

const focusEl = () => {
  if(!props.disabled) {
    input.value.focus();
  }
}

const tagIsValid = (string) => {
  return !(/[.`!@#$%^&*()_+\-=\[\]{};':"\\|,<>\/?~\[ \]]/.test(string));
}

const addTag = (e) => {
  let string = input.value.innerHTML.replace('&nbsp;', '');

  if(tagIsValid(string)) {
    inputError.value = false;
  } else {    
    inputError.value = true;
  }

  if(e.type === 'input' && e.data !== ' ') return;
  
  if(string && tagIsValid(string)) {
    tagArray.value.push(string);
    input.value.innerHTML = '';
  }
  emits('change', tagArray);
}

const deleteTag = () => {
  let tag = input.value.innerHTML;
  if(tag === '') {
    tagArray.value.pop();
  }

  emits('change', tagArray);
}

const removeTag = (index) => {
  if(props.disabled) return false;
  tagArray.value.splice(index, 1);
  emits('change', tagArray);
}

</script>
<style lang="less" scoped>
.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: -1px -1px 1px rgb(0 0 0 / 25%), inset 1px 1px 1px rgb(0 0 0 / 50%);
  border-radius: 5px;
  padding: 4px 4px;
  min-height: 40px;

  &:not([disabled]) {
    cursor: text;
  }

  &:focus-within {
    .admin & {
        border: 1px solid var(--dark-highlight-color);
        box-shadow: 0 0 0 1px var(--dark-highlight-color) inset;
      }
  }
}

.tag {
  background-color: #eee;
  border: 1px solid #ccc;
  border-radius: 3px;
  padding: 3px 10px;
  font-size: 14px;background: #D9D9D9;
  color: rgba(0, 0, 0, 0.65);
  border: 0.5px solid #8C8C8C;
  box-shadow: inset -1px -1px 2px rgba(0, 0, 0, 0.25), inset 1px 1px 2px rgba(255, 255, 255, 0.65);
  border-radius: 4px;
  height: 30px;

  svg {
    width: 16px;
    margin-left: 4px;
    cursor: pointer;
  }
}

.tag-input {
  line-height: calc(30px - 6px);
  margin: 3px;
  min-width: 5px;

  &:focus {
    outline: none;
  }
}

.error {
  color: #F04E4E;
  font-size: 14px;
  margin-top: 4px;
}
</style>
  