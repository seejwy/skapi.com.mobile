import { createApp, reactive, watch } from 'vue';
import App from './App.vue';
import './assets/main.less';
import Admin from './admin';
import('@/assets/main.less');


let awaitConnection, skapi, state, log;
let desktopMedia = '(min-width: 769px)';
const desktopSize = window.matchMedia(desktopMedia);
const isMobileDevice = /Mobile|Android|iPhone|iPad|Windows Phone/i.test(navigator.userAgent);

let domain = window.location.host.split('.')

if(domain[0] === 'm' && (desktopSize.matches || !isMobileDevice)) {
    domain[0] = 'www';
    window.location.href = 'http://' + domain.join('.') + window.location.pathname;
} else if (domain[0] === 'www' && (!desktopSize.matches && isMobileDevice)) {
    domain[0] = 'm';
    window.location.href = 'http://' + domain.join('.') + window.location.pathname;
} else {
    // init state
    state = reactive({
        user: null,
        connection: null,
        getServices: null,
        services: null,
        showVerificationNotification: false,
        setVerificationDelay: () => {
            localStorage.setItem(`verification_message_${state.user.user_id}`, new Date().getTime());
            state.showVerificationNotification = false;
        },
        blockingPromise: new Promise(res => res())
    });
    
    // init skapi
    skapi = new Admin();
    
    awaitConnection = skapi.__connection.then(c => {
        state.connection = c;
        state.user = skapi.user;
    });

    skapi.getProfile({ refreshToken: true }).then(u => {
        state.user = u;
    }).catch(err => err);
    
    watch(() => state.user, user => {
        if (user) {
            const ONE_DAY = 86400;
            if (!state.user?.email_verified && (Number(localStorage.getItem(`verification_message_${state.user.user_id}`)) + ONE_DAY) < new Date().getTime()) {
                state.showVerificationNotification = true;
                localStorage.removeItem(`verification_message_${state.user.user_id}`);
            }
            state.getServices = new Promise(async res => {
                if (!state.services) {
                    state.services = (await skapi.getServices());
                }
                res(state.services);
            });
        }
        else {
            state.getServices = null;
        }
    });
    
    function storeServices() {
        if (state.user) {
            window.sessionStorage.setItem(state.user.user_id, JSON.stringify(state.services));
        }
    }
    
    // attach event to save service list on close
    window.addEventListener('beforeunload', storeServices);
    window.addEventListener("visibilitychange", storeServices);
    
    // init vue
    const app = createApp(App);
    let router = import('@/router/index.js');
    
    router.then((module) => {
        const routes = module.default;
    
        app.use(routes);
        app.mount('#app');
        app.config.warnHandler = function (msg, vm, trace) {
            return null;
        };
    
    })
    
    log = v => { console.log(v); return v; };
}

export { skapi, state, awaitConnection, log };
