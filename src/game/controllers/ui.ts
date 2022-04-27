import { useStore } from "@/store";
import {InfopanelTarget} from '@/game/classes/info'
const store = useStore();

export function showInfoPanel2(target:InfopanelTarget|null){
    console.log('weee')
    store.commit("setTarget",target);
}
export function goBackInfoPanelHistory(){
    store.commit('goBackInfoPanelHistory');
}
export function hasPrev() {
    return store.state.targetHistory.length > 1;
}
export function closeInfoPanel(){
    store.commit('setTarget',null)
}
export function showErrorPanel(message:string){
    store.commit('setError',message);
}
export function hideErrorPanel(){
    store.commit('setError',null);
}


export function fullscreen(state:boolean){
    store.commit('fullscreen',state);
}