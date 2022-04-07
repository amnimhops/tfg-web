import { createStore, Store } from 'vuex'
import { InjectionKey } from 'vue'
import {  InfopanelTarget } from '@/game/classes/info';
import {  Stockpile } from 'shared/monolyth';

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
  stockpiles?: Stockpile[];
  panelSelection: InfopanelTarget[];
  gameLoaded:boolean;
}

export const store = createStore<GameStore>({
  state: {
    panelSelection:[],
    stockpiles:[],
    gameLoaded:false
  },
  getters: {
    
  },
  mutations: {
    panelSelection(store:GameStore, selection:InfopanelTarget[]=[]) {
      console.log("valor", selection);
      store.panelSelection = selection;
    },

    setStockpiles(store:GameStore, stockpiles:Stockpile[]) {
      store.stockpiles = stockpiles;
    },
    setStockpile(store:GameStore, stockpile:Stockpile) {
      store.stockpiles = store.stockpiles?.map( sp => {
        if(sp.resourceId == stockpile.resourceId){
          return stockpile;
        }else{
          return sp;
        }
      });
    },
    addResource(store:GameStore, resource:{id:string,amount:number}) {
      store.stockpiles?.filter(sp => sp.resourceId == resource.id).forEach(sp => sp.amount += resource.amount);
    },
    setGameState(store:GameStore, state:boolean){
      store.gameLoaded = state;
    }
  },
  actions: {
  },
  modules: {
  }
});

export const key: InjectionKey<Store<GameStore>> = Symbol();

export function useStore():Store<GameStore> {
  return store;
}