import {createRouter, createWebHistory} from 'vue-router';
import WebsiteApp from '@/site/WebsiteApp.vue';

import GameApp from '@/game/GameApp.vue';
import PlayerAreaView from '@/game/views/PlayerAreaView.vue';
import TechnologyView from '@/game/views/TechnologyView.vue';
import ResourceView from '@/game/views/ResourceView.vue';
import WorldMapView from '@/game/views/WorldMapView.vue';
import MessagingView from '@/game/views/MessagingView.vue';
import ActivityView from '@/game/views/ActivityView.vue';

import RegisterView from '@/site/views/RegisterView.vue';
import LoginView from '@/site/views/LoginView.vue';
import ErrorView from '@/site/views/ErrorView.vue';
import GameList from '@/site/views/GameList.vue';
import GameView from '@/site/views/GameView.vue';
import HomeView from '@/site/views/HomeView.vue';



/**
 * Nota mental: no puede haber dos rutas hijas
 * con el mismo nombre, la app empieza a quejarse
 * argumentando que no hay coincidencia.Por ejemplo:
 *   site/home
 *   game/home
 */
const routes = [
    { 
        path: '/game', component: GameApp,
        children:[
            {path:'area',name:'area',component:PlayerAreaView},
            {path:'technology/:id?',name:'technology',component:TechnologyView},
            {path:'resource/:id?',name:'resource',component:ResourceView},
            {path:'world/:id?',name:'world',component:WorldMapView},
            {path:'messaging/',name:'messaging',component:MessagingView},
            {path:'activity/:id?',name:'activity',component:ActivityView}
        ]
    },
    { 
        path: '/', component: WebsiteApp,
        children:[
            {path:'',name:'home',component:HomeView},
            {path:'/register/:id?',name:'register',component:RegisterView},
            {path:'/view/:id',name:'view',component:GameView},
            {path:'/login/:id?',name:'login',component:LoginView},
            {path:'/gamelist/',name:'gamelist',component:GameList},
            {path:'/error',name:'error',component:ErrorView}
        ]
    }
]

export const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})