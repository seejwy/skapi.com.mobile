<template lang="pug">
.wrapper
    .container
        h1 Account Deleted
        p We are sad to see you go. Your account has been deleted at your request. Thank you again for being a part of Skapi.
        p We hope to see you again!
        RouterLink(to="/") Return to Home
        .logo
</template>
<style lang="less" scoped>
.container {
    text-align: center;
    margin-top: var(--head-space);

    h1 {
        font-size: 32px;
        margin: 20px 0 40px 0;
    }

    p {
        margin: 40px auto;
        line-height: 1.5;
    }
}
.logo {
    height: 35px;
    width: auto;
    -webkit-mask: url(@/assets/img/logo.svg) no-repeat center;
    mask: url(@/assets/img/logo.svg) no-repeat center;
    background-color: var(--primary-color);
}
a {
    display: block;
    color: var(--primary-color);
    font-weight: bold;
    text-decoration: none;
    margin: 40px auto;
}
</style>