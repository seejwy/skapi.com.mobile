<template lang="pug">
Teleport(to="#leftButton")
    slot(name="leftButton")

Teleport(to="#title")
    slot(name="title")

Teleport(to="#rightButton")
    slot(name="rightButton")
</template>