import { useStore } from "@/store";
import {InfopanelTarget} from '@/game/classes/info'
const store = useStore();

export function showInfoPanel2(target:InfopanelTarget|null){
    console.log('weee')
    store.commit("setTarget",target);
}
export function showInfoPanel(target:InfopanelTarget[],index=0){
    store.commit('setPanelTargets',target);
    store.commit('changeSelectionIndex',index);
}
export function closeInfoPanel(){
    store.commit('setPanelTargets',[])
}