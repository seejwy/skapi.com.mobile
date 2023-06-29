<template lang="pug">
div(v-for="pageType in pages" :class="pageType" ref="container")
    template(v-for="types in inputTypes" )
        sui-input(:type="types" :placeholder="types") 
        sui-input(:type="types" :placeholder="`disabled ${types}`" disabled) 
        sui-input(:type="types" :placeholder="types" value="hello") 
        sui-input(:type="types" :placeholder="`disabled ${types}`" disabled value="hello") 
        br

    sui-textarea hello
    br
    .login(style="padding: 10px; background: #fff")
        sui-input.app-input(type="text")
        sui-button(type="button") Hello
        br
        sui-input(type="checkbox")
    br
    sui-input(type="checkbox")
    sui-input(type="checkbox" disabled)
    sui-input(type="checkbox" checked disabled)
    
    br
    sui-input(type="radio")
    sui-input(type="radio" disabled)
    sui-input(type="radio" checked disabled)
    br
    form(@submit.prevent="setInvalid")
        sui-input(type="text" @click="(e) => { e.target.setCustomValidity('rong'); e.target.checkValidity(); }")
        input(type="submit")
    br
    fieldset
        legend  Buttons
        sui-input(type="submit")
        sui-input(type="reset")
        sui-button(type="button" @click="test" ) Button
        sui-button(type="button" @click="test" disabled) Disabled but alert
        br
        sui-button(type="submit") Submit
        sui-button(type="submit" disabled) Disabled Submit
        br
        sui-button(type="reset") Reset
        sui-button(type="reset" disabled) Disabled Reset
        br
        sui-button.lineButton(type="button") Line Button
        sui-button.lineButton(type="button" disabled) Disabled Button
        br
        sui-button.textButton(type="button") Text Button
        sui-button.textButton(type="button" disabled) Disabled Button
        br
        SubmitButton Submit
        SubmitButton(disabled @click="test") Submit
        SubmitButton(loading @click="test") Submit
        br
        sui-button.icon-button 
    br
    sui-select
        option(value="hello") Hello
    sui-select(disabled)
        option(value="hello") Hello 
    br
    .select-input
        sui-input 
        sui-select
            option(value="hello") Hello
</template>
<script setup>
import { ref, onMounted, nextTick } from 'vue';
import SubmitButton from '@/components/SubmitButton.vue';

const pages = ref(['admin', 'normal'])
const inputTypes = ref([
    'text',
    'password',
    'email',
    'search',
    'number'
]);

const test = () => {
    alert("Clicked");
}

const container = ref(null);

const getSize = () => {
    // container.value.forEach(con => {
    //     Array.from(con.children).forEach(el => {
    //         console.log(el);
    //         if(el.tagName !== 'BR') {
    //             let measurement = document.createElement('div');
    //             let size = document.createElement('div');
    //             let border = document.createElement('div');
    //             let padding = document.createElement('div');
    //             let content = document.createElement('div');

    //             size.append(el.offsetHeight);
    //             measurement.append(size);
    //             measurement.className = 'measurement';
    //             con.insertBefore(measurement, el.nextSibling);
    //         }
    //     })
    // });
}

onMounted(async () => {
    setTimeout(getSize, 500)
})
</script>

<style lang="less" scoped>
@import '@/assets/variables.less';
.admin {
    background-color: #505050;
}
.normal {
    background-color: #fafafa;
}

.normal,
.admin {
    padding: 50px;
    
    & > *,
    & fieldset > * {
        display: inline-block;
        margin: 10px;
    }
}

legend {
    .admin & {
        color: #fff;
    }
}

.measurement {
    font-size: xx-small;
    vertical-align: middle;
    display: inline-block;
    margin: 10px;
}
.border {
    background: #fddd9b;
}
.padding {
    background: #c3d08b;
}
.content {
    background: #8cb6c0;
}
</style>
