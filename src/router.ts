import {createRouter, createWebHistory} from 'vue-router';
import WebsiteApp from '@/site/WebsiteApp.vue';
import GameApp from '@/game/GameApp.vue';

const routes = [
    { path: '/game', component: GameApp },
    { path: '/', component: WebsiteApp }
]

export const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})