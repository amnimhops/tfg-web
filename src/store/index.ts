import { createStore, Store } from 'vuex'
import { InjectionKey } from 'vue'
import {  InfopanelTarget } from '@/game/classes/info';
import { Link, User, WithToken } from 'server/monolyth';
import VuexPersistence from 'vuex-persist'

/**
 * Nota: Este módulo exporta por un lado store y key, por otro useStore; todos hacen lo mismo.
 * 
 * Los dos primeros sirven para inyectar vuex dentro de los componentes javascript a través de this.$store
 * El segundo es para hacer accesible el almacen de datos a los componentes escritos en typescript.
 * 
 * https://vuex.vuejs.org/guide/typescript-support.html#typing-store-property-in-vue-component
 * 
 * Entre escribir una mejora del módulo y diseñar una función se elige este segundo método por
 * ser más flexible, ya que hace accesible el almacén a otras áreas sin ser necesariamente componentes
 * vue.
 */
export interface GameStore {
  target:InfopanelTarget|null;
  targetHistory:InfopanelTarget[];
  error:string|null;
  gameLoaded:boolean;
  user?:User;
  token?:string;
  gameId?:string;
  enableMenuses?:boolean,
  selectedMenu?:string
  lights?:boolean;
}

/**
 * Persistencia en el navegador
 */
const vuexLocal = new VuexPersistence<GameStore>({
  storage: window.localStorage
});

export const store = createStore<GameStore>({
  state: {
    target:null,
    targetHistory:[],
    error:null,
    gameLoaded:false,
    enableMenuses:true
  },
  mutations: {
    enableMenuses(store:GameStore,state:boolean){
      store.enableMenuses = state;
    },
    setTarget(store:GameStore,selection:InfopanelTarget|null){
      if(selection == null){
        store.targetHistory = [];
        store.target = null;
      }else{
        store.targetHistory = [...store.targetHistory,selection];
        store.target = selection;
      }
      
    },
    setLights(store:GameStore,status:boolean){
      store.lights = status;
    },
    selectMenu(store:GameStore,menu:string){
      store.selectedMenu = menu;
    },
    goBackInfoPanelHistory(store:GameStore){
      if(store.targetHistory.length > 1){
        const i = store.targetHistory.length -1;
        store.targetHistory.splice(i,1);
        store.target = store.targetHistory[i-1];
      }
    },
    setError(store:GameStore,message:string|null){
      store.error = message;
    },
    setSession(store:GameStore,session:WithToken<User>){
      console.log('Session set to',session)
      store.token = session.token;
      store.user = session;
    },
    closeSession(store:GameStore){
      store.token = undefined;
      store.user = undefined;
      console.log('Session closed');
    },
    setGameId(store:GameStore,id:string){
      store.gameId = id;
    }
  },
  actions: {
  },
  modules: {
  },
  plugins: [vuexLocal.plugin]
});

export const key: InjectionKey<Store<GameStore>> = Symbol();

export function useStore():Store<GameStore> {
  return store;
}