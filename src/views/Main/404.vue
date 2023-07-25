<template lang="pug">
div
    sui-flextext(max-size='48') 404: Page does not exist :(
</template>
<script setup>
import { useRouter } from 'vue-router';

let router = useRouter();

let pathnameArray = window.location.pathname.split('/');
let pathFound = false;

while(pathnameArray.length && !pathFound) {
    pathnameArray.pop();
    let pathname = pathnameArray.join("/");
    let resolvedPath = router.resolve(pathname);
    if(resolvedPath.name && resolvedPath.name !== 'notFound') {
        router.replace({name: resolvedPath.name, params: resolvedPath.params});
        pathFound = true;
    }
}
</script>
<style lang="less" scoped>
div {
    text-align: center;

    sui-flextext {
        margin-top: 4em;
        font-weight: bold;
    }
}
</style>