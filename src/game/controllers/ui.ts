import { useStore } from "@/store";
import {InfopanelTarget} from '@/game/classes/info'
import { limit } from "server/functions";
const store = useStore();

export function showInfoPanel2(target:InfopanelTarget|null){
    console.log('weee')
    store.commit("setTarget",target);
}
export function goBackInfoPanelHistory(){
    store.commit('goBackInfoPanelHistory');
}
/**
 * Devuelve un target anterior del histórico del panel.
 * Un valor de -1 devolverá el último target, -2 el anterior y
 * así sucesivamente.
 * @param stepsBack Número de pasos que debe volver atrás
 * @returns {InfopanelTarget} Target del InfoPanel buscado
 */
export function getHistoryTarget(stepsBack:number){
    const storeHistoryLength = store.state.targetHistory.length;
    // Toma un valor basado en stepsBack tal que 0 <= index < length
    const i = limit(storeHistoryLength+stepsBack-1,0,storeHistoryLength-1); // El -1 es importante
    console.log(i);
    return store.state.targetHistory[i];
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