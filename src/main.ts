import { createApp } from 'vue'
import {router} from '@/router';
//import GameClient from './game/GameClient.vue'
import App from './App.vue';
import { store, key } from './store'
import "./styles/styles.scss";

import { library } from '@fortawesome/fontawesome-svg-core'
import { faCheck,faBars, faHome, faList, faSignIn,faSignOut,faAngleLeft,faAngleRight,faCircle,faUsers,faStar,faHandshake,faFistRaised,faWindowClose, faImage } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

library.add(faCheck, faBars, faHome, faList, faSignIn,faSignOut,faAngleLeft,faAngleRight,faCircle,faUsers,faStar,faHandshake,faFistRaised,faWindowClose,faImage);

console.log(library)
createApp(App)
    .component('fa', FontAwesomeIcon)
    .use(store,key)
    .use(router)
    .mount('#app');

