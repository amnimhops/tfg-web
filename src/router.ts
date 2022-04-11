import {createRouter, createWebHistory} from 'vue-router';
import WebsiteApp from '@/site/WebsiteApp.vue';

import GameApp from '@/game/GameApp.vue';
import PlayerAreaView from '@/game/views/PlayerAreaView.vue';
import TechnologyView from '@/game/views/TechnologyView.vue';
const routes = [
    { 
        path: '/game', component: GameApp,
        children:[
            {path:'home',component:PlayerAreaView},
            {path:'technology',component:TechnologyView}
        ]
    },
    { path: '/', component: WebsiteApp }
]

export const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})