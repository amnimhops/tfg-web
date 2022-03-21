import { createApp } from 'vue'
import GameClient from './GameClient.vue'
import { store, key } from './store'
import "./styles/styles.scss";
createApp(GameClient).use(store,key).mount('#game-client')
