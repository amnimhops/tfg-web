import { Activity } from '../models/activities';
import { Player } from '../models/players';
import { createPlayer, createWorld, getAssets, addTask } from './fakeServer';

let apiToken = null;

/**
 * Esta función devuelve todos los recursos
 * gráficos, sonoros y textuales necesarios
 * para el juego del jugador asociado al 
 * token.
 * @returns {Promise<Asset[]>}
 */
export function findGameAssets(){
    return new Promise((resolve) =>{
        resolve(getAssets());
    });
}

export function getWorldDescriptor(){
    return new Promise( resolve => {
        resolve(createWorld());
    });
}
/**
 * Usa el token suministrado para establecer una conexión con el servidor
 * e identificar al jugador. Si la autenticación es correcta devuelve la
 * información inicial del jugador. 
 * @param {string} token - Token de identificación
 * @returns {PlayerData} Los datos de inicialización del jugador
 */
export function authenticate(token:string):Promise<Player>{
    apiToken = token;
    console.log('Api token set to',apiToken)
    return new Promise( (resolve) => {
        resolve(createPlayer());
    });
}

/**
 * Verifica que la actividad que se quiere llevar a cabo
 * es viable y notifica al servidor su inicio.
 * 
 * @param {Activity} activity - Información de la actividad que se lleva a cabo
 */
export function startActivity(activity:Activity){
    addTask(activity);
    console.log('Activity started',activity);
}