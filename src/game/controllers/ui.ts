import { useStore } from "@/store";
import {InfopanelTarget} from '@/game/classes/info'
const store = useStore();

export function showInfoPanel(target:InfopanelTarget[]){
    store.commit('panelSelection',target);
}
export function closeInfoPanel(){
    store.commit('panelSelection',[])
}