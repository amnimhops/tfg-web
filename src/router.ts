import {createRouter, createWebHistory} from 'vue-router';
import WebsiteApp from '@/site/WebsiteApp.vue';

import GameApp from '@/game/GameApp.vue';
import PlayerAreaView from '@/game/views/PlayerAreaView.vue';
import TechnologyView from '@/game/views/TechnologyView.vue';
import ResourceView from '@/game/views/ResourceView.vue';
import WorldMapView from '@/game/views/WorldMapView.vue';
import MessagingView from '@/game/views/MessagingView.vue';
import ActivityView from '@/game/views/ActivityView.vue';

const routes = [
    { 
        path: '/game', component: GameApp,
        children:[
            {path:'home',name:'home',component:PlayerAreaView},
            {path:'technology/:id?',name:'technology',component:TechnologyView},
            {path:'resource/:id?',name:'resource',component:ResourceView},
            {path:'world/:id?',name:'world',component:WorldMapView},
            {path:'messaging/',name:'messaging',component:MessagingView},
            {path:'activity/:id?',name:'messaging',component:ActivityView}
        ]
    },
    { path: '/', component: WebsiteApp }
]

export const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})