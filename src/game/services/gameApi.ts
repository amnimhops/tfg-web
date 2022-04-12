import { randomInt, toMap } from 'shared/functions';
import { Activity, ActivityTarget, ActivityType, Asset, Cell, CellInstance, EnqueuedActivity, Game, GameInstance, InstancePlayer, Media, Placeable, Player, Resource, ResourceAmount, ResourceFlow, Stockpile, Technology, UIConfig } from 'shared/monolyth';
import { ActivityAvailability, BuildingActivityTarget, ResearchActivityTarget } from '../classes/activities';
import { AssetManager, ConstantAssets } from '../classes/assetManager';
import { EventEmitter, IEventEmitter } from '../classes/events';
import { GameData } from '../classes/gameIndex';

import { createGameList, createPlayer, createSinglePlayerMatch, getAssets} from './fakeServer';

function unknownMedia(text:string):Media{
    return {
        description:'Desconocido',
        icon:{id:'unknown',type:'image',url:''},
        image:{id:'unknown',type:'image',url:''},
        thumbnail:{id:'unknown',type:'image',url:''},
        name:text
    }
}
export interface IGameAPI extends IEventEmitter{
    authenticate(email:string,pass:string):Promise<Player>;
    joinGame(id:string):Promise<Asset[]>;
    getGameList():Promise<Partial<Game>[]>;
    getCells():Promise<CellInstance[]>;
    getGameData():GameData;
    getInstancePlayer():InstancePlayer;
    startActivity(type:ActivityType,target:ActivityTarget):Promise<string>
    checkActivityAvailability(type:ActivityType,target:ActivityTarget):ActivityAvailability;
    getResearchedTechnologies():Technology[];
    getQueue():EnqueuedActivity[];
    /**
     * Métodos de obtención de información sobre elementos de juego
     */
    getTechnologyList():Technology[];
    getCell(id:string):Cell;
    getResource(id:string):Resource;
    getPlaceable(id:string):Placeable;
    getActivity(type:ActivityType):Activity;
    getUIConfig(): UIConfig
}

export const GameEvents = {
    StockpileChanged:'stockpiles_changed',
    ActivityFinished:'activity_finished',
    CellInstanceUpdated:'cell_instance_updated',
    TechnologyResearched:'technology_researched'
}

class MockAPI extends EventEmitter implements IGameAPI {
    private apiToken?:string;
    private currentPlayer?:Player;
    private currentInstancePlayer?:InstancePlayer;
    private currentGame?:GameData;
    private internalGame?:Game;
    private currentInstance?:GameInstance;
    private activityQueue:EnqueuedActivity[] = [];
    private queueInterval:number;
    private resourceCheckInterval:number;
    private lastQueueCheck:number;
    constructor(){
        super();
        this.queueInterval = setInterval(this.processQueue.bind(this),100);
        this.resourceCheckInterval = setInterval(this.processResourceFlows.bind(this),100);
        this.lastQueueCheck = Date.now();
    }

    private processResourceFlows():void{
        // Indexamos por id de recurso los almacenes
        const stockpileMap = toMap(this.getInstancePlayer().stockpiles, sp => sp.resourceId);
        
        for(const cell of this.currentInstance!.cells){
            for(const pid of cell.placeableIds){
                const placeable = this.getPlaceable(pid);
                for(const flow of placeable.flows){
                    const stockpile = stockpileMap[flow.resourceId];
                    //stockpile.amount += flow.

                }
            }
        }
    }
    private processQueue():void{
        const now = Date.now();

        let i = 0;
        
        while(i < this.activityQueue.length){
            const item = this.activityQueue[i];
            const activity = this.getActivity(item.type);
            
            if(item.elapsed>=activity.duration){
                const deleted = this.activityQueue.splice(i,1);
                // Gestionar el fin de actividad
                this.handleCompletedActivity(deleted[0]);
            }else{
                item.elapsed += now - this.lastQueueCheck;
                item.remaining = activity.duration - item.elapsed;
                console.log('Actividad',activity.type,'quedan',activity.duration-item.elapsed);
            }

            i++;
        }

        this.lastQueueCheck = now;
    }
        
    private handleCompletedActivity(item:EnqueuedActivity):void{
        if(item.type == ActivityType.Build){
            this.buildPlaceable(item.target as BuildingActivityTarget);
        }else if(item.type == ActivityType.Research){
            this.finishResearch(item.target as ResearchActivityTarget);
        }
    }

    private finishResearch(target:ResearchActivityTarget){
        this.currentInstancePlayer?.technologies.push(target.tech.id);
        this.raise(GameEvents.TechnologyResearched,target.tech);
    }
    private buildPlaceable(target:BuildingActivityTarget){
        const cellInstance = this.currentInstance!.cells[target.cellInstanceId];
        cellInstance.placeableIds.push(target.placeableId);
        this.raise(GameEvents.CellInstanceUpdated,cellInstance);
    }

    authenticate(email:string,pass:string):Promise<Player>{
        return new Promise( (resolve) => {
            this.currentPlayer = createPlayer();
            resolve(this.currentPlayer);
        });
    }
    joinGame(id:string):Promise<Asset[]>{
        return new Promise((resolve) =>{
            if(!this.currentPlayer){
                throw new Error('No se ha autenticado');
            }

            const [instance,game] = createSinglePlayerMatch(this.currentPlayer);
            this.currentInstance = instance;
            this.currentInstancePlayer = instance.players.filter( player => player.playerId == this.currentPlayer!.id)[0];
            this.currentGame = new GameData(game);
            this.internalGame = game;
            resolve(getAssets());
        });
    }
    getGameList():Promise<Partial<Game>[]>{
        return new Promise( resolve => {
            resolve(createGameList());
        });
    }
    getCells():Promise<CellInstance[]> {
        return new Promise( (resolve,reject)=>{
            console.log('Cargando celdas del servidor');
            setTimeout(()=> {
                if(!this.currentInstance) {
                    reject('La instancia no está cargada')
                }else{
                    resolve(this.currentInstance.cells.filter( cell => cell.playerId == this.currentInstancePlayer?.playerId))
                }
             } ,1000);
        } );
    }

    getGameData():GameData{
        if(!this.currentGame) throw new Error('No se ha cargado el juego');
        return this.currentGame;
    }
    getInstancePlayer():InstancePlayer{
        if(!this.currentInstancePlayer) throw new Error('No se ha cargado la sesión del jugador');
        return this.currentInstancePlayer;
    }
    getCell(id:string):Cell{
        if(!this.currentGame) throw new Error('No se ha cargado el juego');
        return this.currentGame.cells[id];
    }
    getResource(id:string):Resource{
        if(!this.currentGame) throw new Error('No se ha cargado el juego');
        return this.currentGame.resources[id];
    }
    
    getPlaceable(id:string):Placeable{
        if(!this.currentGame) throw new Error('No se ha cargado el juego');
        return this.currentGame.placeables[id];
    }
    getTechnologyList():Technology[]{
        return this.internalGame?.technologies || [];
    }
    getUIConfig(): UIConfig {
        return {
            "uiControlFontFamily":"Verdana",
            "uiControlBackgroundColor":"#0b2e6b",
            "uiControlForegroundColor":"#194898",
            "uiControlFontColor":"white",
            "uiControlFontColorDanger":"#dd0a0a",
            "uiControlFontColorDisabled":"#a0a0a0",
            "uiControlTextSize":"1.0em",
            "uiControlTextHeadingSize":"1.5em",
            "uiControlBorderColor":"#293e61",
            "uiControlBorderRadius":"1px",
            "uiControlShadowColor":"#030e20",
            "uiControlBackgroundPrimary":"#b1a91a",
            "uiControlBackgroundSecondary":"#8f1323"
        }
    }
    getResearchedTechnologies():Technology[]{
        if(!this.currentInstancePlayer) throw new Error('No se ha cargado la información del jugador');
        return this.currentInstancePlayer.technologies.map( id => this.currentGame!.technologies[id]);
    }
    getActivity(type:ActivityType):Activity{
        if(!this.currentGame) throw new Error('No se ha cargado el juego');
        return this.currentGame.activities.get(type) || {type,media:unknownMedia('unknown activity'),flows:[],duration:0} ;
    }

    getTechnologyDependencies(tech:Technology):Technology[]{
        const deps:Technology[] = [];
        let parentId = tech.parent;

        while(parentId != null){
            const parent = this.currentGame!.technologies[parentId];
            deps.push(parent);
            parentId = parent?.parent;
        }

        return deps.reverse();
    }

    checkActivityAvailability(type:ActivityType,target:ActivityTarget):ActivityAvailability{
        const failedPreconditions:string[] = [];
        const activity = this.getActivity(type);
        // Comprobamos que hay suficiente para empezar
        const stockPiles = toMap(this.getInstancePlayer().stockpiles, sp => sp.resourceId);
        // No se puede construir si al menos un almacen tiene menos stock que lo que el flujo requiere
        activity.flows.forEach( flow => {
            if(flow.amount >= stockPiles[flow.resourceId].amount){
                const resource = this.currentGame?.resources[flow.resourceId];
                failedPreconditions.push('Faltan '+ (stockPiles[flow.resourceId].amount-flow.amount)+' de '+resource?.media.name);
            }
        });

        // Si es una tecnología:
        if(type == ActivityType.Research){

            // Debe estar sin investigar
            const tech = (target as ResearchActivityTarget).tech;
            if(this.currentInstancePlayer?.technologies.some( t => t == tech.id)){
                failedPreconditions.push('Esta tecnología ya está investigada')
            }
            // No debe estar en cola
            if(this.activityQueue.some( ea => ea.type == ActivityType.Research && (ea.target as ResearchActivityTarget).tech.id == tech.id)){
                failedPreconditions.push('Esta tecnología ya está en cola de investigación');
            }
            // Todo el arbol tecnologico previo debe estar desbloqueado
            const depTree = this.getTechnologyDependencies(tech);
            if(depTree.some( dep => this.currentInstancePlayer?.technologies.indexOf(dep.id) == -1)){
                failedPreconditions.push('Es necesario investigar una tecnología previa');
            }
        }


        return new ActivityAvailability(failedPreconditions.length == 0,type,target,failedPreconditions);
    }

    getQueue():EnqueuedActivity[]{
        return this.activityQueue;
    }
  
    startActivity(type:ActivityType,target:ActivityTarget):Promise<string>{
        const activity = this.getActivity(type);
        const item:EnqueuedActivity = {
            id:Date.now().toString(),
            target,
            type,
            elapsed:0,
            remaining:activity.duration
        };
        
        this.activityQueue.push(item);
        // Descontar el coste de la actividad
        const stockPiles = toMap(this.getInstancePlayer().stockpiles, sp => sp.resourceId);
        activity.flows.forEach(flow => {
            stockPiles[flow.resourceId].amount-=Math.abs(flow.amount);
            this.raise<Stockpile>(GameEvents.StockpileChanged,stockPiles[flow.resourceId]);
        });


        return new Promise( (resolve,reject) => setTimeout( ()=> resolve(item.id) , 1000));
    }
}

let api:IGameAPI|null;

export function useGameAPI(){
    if(!api){
        api = new MockAPI();
    }

    return api;
}
