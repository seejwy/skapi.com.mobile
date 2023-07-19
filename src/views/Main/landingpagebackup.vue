<template lang="pug">
section.sectionBox
    .header
        .betaSign Skapi BETA 1.0
        h1 Serverless #[br] Backend API
        .linearGradient Build your next great innovation
        .gettingStartedButton
            span Get Started
            <svg xmlns="http://www.w3.org/2000/svg" width="206" height="40" viewBox="0 0 206 40" fill="none">
                <g clip-path="url(#clip0_3979_1240)">
                    <path d="M-7.98804 39.9403L186.498 39.9403C197.27 39.9403 206 31.0007 206 19.9722C206 8.94367 197.27 3.03901e-05 186.498 2.94484e-05L-7.98803 1.24459e-05L-7.98804 39.9403Z" fill="url(#paint0_linear_3979_1240)"/>
                    <path d="M164.738 31.0057L175.482 19.7766L164.738 8.66668" stroke="white" stroke-width="2" stroke-miterlimit="10"/>
                    <path d="M153.345 20L175.482 20" stroke="white" stroke-width="2" stroke-miterlimit="10"/>
                </g>
                <defs>
                    <linearGradient id="paint0_linear_3979_1240" x1="206" y1="19.9722" x2="-7.98804" y2="19.9722" gradientUnits="userSpaceOnUse">
                    <stop offset="0.15625" stop-color="#001CE9"/>
                    <stop offset="0.713542" stop-color="#293FE6" stop-opacity="0.7"/>
                    <stop offset="1" stop-color="white" stop-opacity="0.3"/>
                    </linearGradient>
                    <clipPath id="clip0_3979_1240">
                    <rect width="206" height="40" fill="white" transform="translate(206 40) rotate(-180)"/>
                    </clipPath>
                </defs>
            </svg>

img(src="@/assets/img/main_illustration.svg")

section.sectionBox
    h2 What is skapi?
    p Skapi is a serverless backend API library solely designed for frontend web developers. #[br]#[br]Start building a full functioning web services directly from your HTML/Javascript.

    a(href='https://docs.skapi.com' target="_blank")
        sui-button Read Document
section.sectionBox.showVideo
    .videoCont 
        <iframe class="video" src="https://www.youtube.com/embed/c5jdIE9wl_8?&rel=0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
section.sectionBox.features(ref="features")
    .feature 
        h3.title Key Features
        .blurp It just works #[br] out of the Box
        .cardWrap
            .card
                .icon
                    img(src="@/assets/img/icons/serverless.svg")
                .right
                    h4.title Serverless
                    p.cont No need for server setup. #[br]
                        | No complex frameworks. #[br]
                        | No dealing with terminals. #[br]
                        | 100% Serverless.
            
            .card
                .icon
                    img(src="@/assets/img/icons/database.png")
                .right
                    h4.title Vanilla Friendly
                    p.cont No schema, #[br]
                        | No SQL queries required. #[br]
                        | Yet, full flexibility that scales with your needs.
            .card
                .icon
                    img(src="@/assets/img/icons/authentication.png")
                .right
                    h4.title Authentication
                    p.cont Security all figured out for you. #[br]
                        | CORS restriction, #[br]
                        | Storage / database security, Login, signup... It just works.
            .card
                .icon
                    img(src="@/assets/img/icons/html.png")
                .right
                    h4.title HTML Friendly
                    p.cont Fully compatible with both vanilla HTML and Webpack-based projects.
section.sectionBox.gettingStarted
    .startCont 
        h3.title Getting Started
        .blurp Import Skapi, #[br] and start building
        .stepsWrapper
            .bar
            .content 
                .step 
                    .title Create Service 
                    .cont Login and Create new Service from your dashboard.
                .step 
                    .title Retrieve ID 
                    .cont Retrieve the service ID and the owner’s ID from the dashboard.
                .step 
                    .title Initialize Skapi 
                    .cont Import and Initialize Skapi from index.html. Replace ‘SERVICE_ID’ and ‘OWNERS_ID’ with appropriate value.
        pre
            code 
                |&lt;!DOCTYPE html&gt;
                |  &lt;script src="https://cdn.jsdelivr.net/npm/skapi-js@latest/dist/skapi.js"&gt;&lt;/script&gt;
                |  &lt;script&gt;
                |    let skapi = new Skapi('
                span SERVICE_ID
                | ', '
                span OWNERS_ID
                | ');
                |  &lt;/script&gt;

section.sectionBox.trySkapi
    .tryCont 
        pre.
            Skapi is currently in BETA. We're inviting you to join us in shaping the future of web development.
            As a BETA user, you'll enjoy full access to our services, absolutely free.
            Join and help us create powerful software that empowers web developers around the world.
        br
        router-link(to="/signup")
            button.startBtn Sign-up
</template>

<script setup>
import { onMounted, ref, onUnmounted, nextTick, onBeforeUnmount } from 'vue';
import gsap from 'gsap';
import ScrollTrigger from "gsap/ScrollTrigger";

let features = ref(null);
let animation = null;
let scrollTrigger = null;
let mediaWatcher = null;

function codeCopy() {
    let doc = document.createElement('textarea');
    doc.textContent = document.querySelector('.preCode pre code').textContent;
    document.body.append(doc);
    doc.select();
    document.execCommand('copy');
    doc.remove();

    alert('The code has been copied.');
}
gsap.registerPlugin(ScrollTrigger);

onMounted(() => {
    document.querySelector('main').classList.add('landing');
});

</script>
<style lang="less">
main {
    &.landing {
        height: 100%;
        overflow-x: hidden;
        background-color: #f5f5f5;
    }

    .sectionBox {
        &:not(.showVideo) {
            padding: 0 20px;
        }

        h3.title {
            font-size: 28px;
            color: #293fe6;
            font-weight: 700;
            margin: 0;
        }

        .blurp {
            font-size: 28px;
            font-weight: bold;
            margin: 26px 0 52px;
        }

        .header {
            color: #262626;
            margin-top: 52px;
            font-size: 20px;

            .betaSign {
                font-style: normal;
                font-weight: bold;
            }

            h1 {
                font-size: 48px;
                margin: 24px 0 18px;
            }
            
            h2 {
                font-size: 28px;

                & ~ p {
                    margin: 24px 0 40px;
                }
            }

            .linearGradient {
                background: linear-gradient(180deg, #FAFF00 0%, rgba(255, 230, 0, 0.00) 97.55%);
                padding: 6px;
            }

            .gettingStartedButton {
                position: relative;
                display: inline-block;
                height: 40px;
                margin-top: 30px;

                span {
                    position: absolute;
                    color: #fff;
                    font-size: 20px;
                    font-weight: bold;
                    top: 50%;
                    left: 50%;
                    transform: translate(calc(-50% - 20px), -50%);
                    white-space: nowrap;
                }
            }
        }        

        &.showVideo {
            position: relative;
            margin: 62px auto 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;

            .videoCont {
                position: relative;
                width: 100%;
                height: 0;
                padding-bottom: 56.25%;

                .video {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                }
            }
        }

        &.features {
            margin-top: 100px;

            .feature {
                .card {                
                    margin-bottom: 75px;

                    .icon img {
                        max-height: 60px;
                    }

                    .title {
                        font-size: 24px;
                        margin: 26px 0;
                    }

                    .cont {
                        font-size: 20px;
                        line-height: 28px;
                    }
                }
            }
        }

        &.gettingStarted {
            margin: 0 auto;

            .stepsWrapper {
                display: flex;
                gap: 35px;

                .bar {
                    width: 20px;
                    background-color: blue;
                    border-radius: 2px;
                }

                .step {
                    &:not(:last-child) {              
                        margin-bottom: 70px;
                    }

                    .title {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 16px;
                    }
                }
            }

            .mlvImg {
                position: relative;
                width: 100%;
                display: none;

                .preCode {
                    position: relative;
                    height: 234px;
                    background-color: #434343;
                    border-radius: 0;
                    color: #fff;
                    overflow-x: scroll;
                    font-size: 16px;
                    font-weight: 400;
                    line-height: 24px;
                    display: flex;
                    align-items: center;
                    padding: 0 20px;

                    span {
                        color: #7C8CFF;
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

                img {
                    width: 512px;
                    height: 300px;
                    object-fit: cover;
                    object-position: top;
                    border-radius: 8px;
                }
            }
        }

        &.trySkapi {
            padding: 90px 0;
            text-align: center;
            font-weight: 700;
            background-color: #293EE6;
            margin-top: 150px;

            .tryCont {
                margin: 0 auto;
                color: #fff;

                pre {
                    font-family: 'Radio Canada';
                    line-height: 28px;
                    font-size: 20px;
                    font-weight: 500;
                    margin: 0;
                    margin-bottom: 28px;
                }

                .startBtn {
                    position: relative;
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