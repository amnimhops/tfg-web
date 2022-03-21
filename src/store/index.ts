import { CellInstance } from '@/game/models/cells';
import { WorldDescriptor } from '@/game/models/worldDescriptor'
import { createStore, Store } from 'vuex'
import { InjectionKey } from 'vue'
import { Stockpile } from '@/game/models/resources';
import { InfoPanelTarget } from '@/game/models/info';

export interface GameStore {
  world?: WorldDescriptor;
  cells?: CellInstance[];
  stockpiles?: Stockpile[];
  panelSelection?: InfoPanelTarget;
}
export const key: InjectionKey<Store<GameStore>> = Symbol();
export const store = createStore<GameStore>({
  state: {
  },
  getters: {
    getPlayerCells(store) {
      return store.cells;
    }
  },
  mutations: {
    panelSelection(store:GameStore, selection) {
      console.log("valor", selection);
      store.panelSelection = selection;
    },
    setCells(store:GameStore, cells:CellInstance[]) {
      store.cells = cells;
    },
    setWorld(store:GameStore, world:WorldDescriptor) {
      store.world = world;
    },
    setStockpiles(store:GameStore, stockpiles:Stockpile[]) {
      store.stockpiles = stockpiles;
    },
    addResource(store:GameStore, resource:{id:string,amount:number}) {
      store.stockpiles?.filter(sp => sp.getResource().getId() == resource.id).forEach(sp => sp.amount += resource.amount);
    }
  },
  actions: {
  },
  modules: {
  }
})
// define your own `useStore` composition function
export function useStore () {
  //console.log(baseUseStore(key));
  //return baseUseStore(key)
  return store;
}