<template lang="pug">
section#section.intro
    .container 
        span Skapi BETA 1.0
        h1 Serverless #[br] Backend API
        p Build your next great innovation
        br
        a(href='https://docs.skapi.com' target="_blank")
            img.btnImg(src="@/assets/img/icons/Asset6.svg")
            span Get Started
            img.arrowImg(src="@/assets/img/icons/arrow_right.svg")
img.mainImg(src="@/assets/img/icons/main_illu_mobile.svg")

section#section.video
    .container 
        .desc
            h4 What is Skapi?
            p 
                | Skapi is a serverless backend API library solely designed for frontend web developers. 
                br
                br
                | Start building a full functioning web services directly from your HTML/Javascript.
            a(href='https://docs.skapi.com' target="_blank")
                sui-button Read Document
.youtube 
    iframe.video(src="https://www.youtube.com/embed/c5jdIE9wl_8?&rel=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen)

section#section.features 
    .container 
        h5 Key Features
        h4 It just works out of the box
        .cardWrap 
            .card 
                .icon
                    img(src="@/assets/img/icons/Serverless.svg")
                h4.tit Serverless
                p.desc No need for server setup. #[br]
                    | No complex frameworks. #[br]
                    | No dealing with terminals. #[br]
                    | 100% Serverless.
            .card 
                .icon
                    img(src="@/assets/img/icons/Database.png")
                h4.tit Database
                p.desc No schema,  #[br]
                    | No SQL queries required.  #[br]
                    | Yet, full flexibility that scales with your needs.
            .card 
                .icon
                    img(src="@/assets/img/icons/Authentication.png")
                h4.tit Authentication
                p.desc Security all figured out for you.  #[br]
                    | CORS restriction,  #[br]
                    | Storage / database security, Login, signup... It just works.
            .card 
                .icon
                    img(src="@/assets/img/icons/landing_page_html_logo.png")
                h4.tit HTML Friendly
                p.desc Fully compatible with both vanilla HTML and Webpack-based projects.

section#section.start(ref="startSection")
    .container 
        h5 SDKS
        h4 Import Skapi, and start building
        .startWrap
            .steps
                .bar(ref="stepBar" :class="{ active: activeBar }")
                .cont 
                    .step 
                        .tit Create Service
                        .desc Login and Create new Service from your dashboard.
                    .step 
                        .tit Retrieve ID
                        .desc Retrieve the service ID and the owner’s ID from the dashboard.
                    .step 
                        .tit Initialize Skapi
                        .desc Import and Initialize Skapi from index.html. Replace #[em ‘SERVICE_ID’] and #[em ‘OWNERS_ID’] with appropriate value.
            .code
                .codeCopy(@click="codeCopy")
                    img(src="@/assets/img/icons/copy.svg")
                .preCode
                    .codeNum 1#[br]2#[br]3#[br]4#[br]5#[br]6#[br]7#[br]8#[br]9
                    pre
                        code
                            |&lt;!DOCTYPE html&gt;
                            |&lt;head&gt;
                            |&lt;script src="https://cdn.jsdelivr.net/npm/skapi-js@latest/dist/skapi.js"&gt;&lt;/script&gt;
                            |&lt;/head&gt;
                            |&lt;script&gt;
                            |    let skapi = new Skapi('
                            span SERVICE_ID
                            | ', '
                            span OWNERS_ID
                            | ');
                            |&lt;/script&gt;

section#section.signup 
    .cont
        p 
            | Skapi is currently in BETA. We're inviting you to join us in shaping the future of web development. 
            br
            | As a BETA user, you'll enjoy full access to our services, absolutely free. 
            br
            | Join and help us create powerful software that empowers web developers around the world.
        router-link(to="/signup")
            button Sign-up
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';

let stepBar = ref(null);
let startSection = ref(null);
let activeBar = ref(false);

let barControl = () => {
    let currentScroll = window.scrollY + (window.innerHeight / 1.5);

    if (currentScroll >= startSection.value.offsetTop) {
        activeBar.value = true;
    } else {
        activeBar.value = false;
    }
}

let codeCopy = () => {
    let doc = document.createElement('textarea');
    doc.textContent = document.querySelector('.preCode pre code').textContent;
    document.body.append(doc);
    doc.select();
    document.execCommand('copy');
    doc.remove();

    alert('The code has been copied.');
}

onMounted(() => {
    document.querySelector('main').classList.add('landing');
    window.addEventListener('scroll', barControl);
});

onBeforeUnmount(() => {
    window.removeEventListener('scroll', barControl);
});
</script>

<style lang="less">
main {
    &.landing {
        height: 100%;
        overflow-x: hidden;
        background-color: #f5f5f5;
        color: #262626;
    }

    .youtube {
        width: 100%;
        margin: 68px 0 100px;

        .video {
            width: 100%;
            height: 400px;
            box-shadow: 7px 7px 18px #bbb;
        }
    }



    .mainImg {
        display: block;
        width: 100%;
        margin: 60px 0;
    }

    #section {
        .container {
            padding: 0 20px;
            margin: 0 auto;
            width: 100%;
            box-sizing: border-box;

            h1 {
                font-size: 48px;
                margin: 24px 0 12px 0;
            }

            h4 {
                font-size: 28px;
                font-weight: 700;
                margin: 28px 0 100px 0;
            }

            h5 {
                font-size: 28px;
                font-weight: 700;
                color: #293FE6;
                margin: 0;
            }

            span {
                font-size: 20px;
            }

            p {
                font-size: 20px;
            }
        }

        &.intro {
            margin: 50px 0 20px 0;
            font-weight: 700;

            .container {
                position: relative;
                width: 100%;
                height: 100%;

                p {
                    display: inline-block;
                    font-size: 20px;
                    font-weight: 500;
                    margin: 0 0 50px 0;
                    background: linear-gradient(180deg, #FAFF00 0%, rgba(255, 230, 0, 0.00) 97.55%);
                }

                a {
                    position: relative;
                    text-align: left;
                    display: inline-block;
                    height: 40px;
                    text-decoration: none;
                    font-size: 24px;
                    margin-left: -20px;

                    font-size: 20px;
                    color: #fff;

                    .btnImg {
                        transform: rotate(180deg);
                        width: 220px;
                    }

                    .arrowImg {
                        position: absolute;
                        right: 10px;
                        width: 40px;
                        top: 50%;
                        transform: translateY(-50%);
                        filter: invert(100%);
                    }

                    span {
                        position: absolute;
                        top: 50%;
                        left: 50px;
                        transform: translateY(-50%);
                        white-space: nowrap;
                    }
                }
            }
        }

        &.video {
            .container {
                display: flex;
                flex-wrap: nowrap;
                justify-content: space-between;

                .desc {
                    width: 100%;
                    padding: 0 20px;

                    h4 {
                        margin: 24px 0;
                    }

                    p {
                        font-size: 20px;
                        font-weight: 500;
                        line-height: 32px;
                        margin: 0 0 40px 0;

                        span {
                            color: #293FE6;
                        }
                    }
                }
            }
        }

        &.features {
            .cardWrap {
                width: 100%;

                &:last-child {
                    margin-right: 0;
                }

                .card {
                    width: 100%;
                    margin-bottom: 75px;

                    &:first-child {
                        .icon {
                            padding: 7px 0;
                        }
                    }

                    &:last-child {
                        .icon {
                            padding: 10px 0;
                        }
                    }

                    .icon {
                        height: 70px;

                        img {
                            height: 100%;
                        }
                    }

                    .tit {
                        font-size: 24px;
                        font-weight: 700;
                        margin: 27px 0;
                    }

                    .desc {
                        font-size: 20px;
                        font-weight: 400;
                        line-height: 28px;
                    }
                }
            }
        }

        &.start {
            margin-bottom: 120px;

            h4 {
                margin-bottom: 50px;
            }

            .startWrap {
                width: 100%;
                display: flex;
                flex-direction: row;
                flex-wrap: wrap;

                .steps {
                    width: 100%;
                    display: flex;
                    gap: 25px;

                    .bar {
                        flex-shrink: 0;
                        width: 20px;
                        height: 100%;
                        background-color: #ddd;
                        border-radius: 4px;

                        &.active {
                            background-image: linear-gradient(to bottom, #001CE9 0%, #fff 96%);
                            animation: fadeInText 1s ease-out forwards;
                        }

                        @keyframes fadeInText {
                            0% {
                                opacity: 0;
                            }

                            100% {
                                opacity: 1;
                            }
                        }
                    }

                    .cont {
                        .step {
                            margin-bottom: 40px;

                            &:last-child {
                                margin-bottom: 0;
                            }

                            .tit {
                                font-size: 24px;
                                font-weight: 700;
                                margin-bottom: 12px;
                            }

                            .desc {
                                font-size: 16px;
                                font-weight: 400;
                                line-height: 24px;

                                em {
                                    color: #293FE6;
                                }
                            }
                        }
                    }
                }

                .code {
                    position: relative;
                    width: 100%;
                    margin-top: 60px;

                    .preCode {
                        position: relative;
                        height: 100%;
                        background-color: #434343;
                        color: #fff;
                        font-size: 16px;
                        font-weight: 400;
                        line-height: 24px;
                        border-radius: 8px;
                        overflow-x: auto;
                        overflow-y: hidden;
                        display: flex;
                        padding: 40px 60px 60px 65px;

                        span {
                            color: #7C8CFF;
                        }

                        .codeNum {
                            position: absolute;
                            top: 55px;
                            left: 30px;
                            width: 100%;
                            height: 100%;
                            z-index: 2;
                            color: #666;
                            line-height: 25px;
                        }
                    }


                    .codeCopy {
                        position: absolute;
                        right: 24px;
                        top: 24px;
                        width: 24px;
                        height: 24px;
                        z-index: 99;

                        img {
                            width: 24px;
                            height: 24px;
                            filter: invert(100%);
                            cursor: pointer;
                        }
                    }
                }
            }
        }

        &.signup {
            width: 100%;
            padding: 40px 20px;
            background: url("@/assets/img/icons/Asset 33.png") no-repeat center;
            background-size: cover;

            .cont {
                text-align: center;

                p {
                    font-size: 20px;
                    line-height: 28px;
                    color: #fff;
                    margin: 0 0 30px 0;
                }

                button {
                    width: 180px;
                    height: 40px;
                    font-weight: 700;
                    font-size: 16px;
                    color: #fff;
                    background: rgba(217, 217, 217, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.65);
                    border-radius: 4px;
                    cursor: pointer;
                }
            }

        }
    }
}

</style>