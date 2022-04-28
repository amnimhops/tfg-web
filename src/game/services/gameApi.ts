import { countdown, countdownStr, randomInt, randomItem, range, toMap } from 'shared/functions';
import { MAP_SIZE, randomText } from 'shared/mocks';
import { Activity, ActivityTarget, ActivityType, Asset, Cell, CellInstance, EnqueuedActivity, FlowPeriodicity, Game, GameInstance, GlobalProperties, InstancePlayer, InstancePlayerStats, Media, Message, MessageType, Placeable, PlaceableInstance, Player, Resource, ResourceAmount, ResourceFlow, SearchResult, Stockpile, Technology, TradingAgreement, UIConfig, Vector } from 'shared/monolyth';
import { ActivityAvailability, BuildingActivityTarget, DismantlingActivityTarget, ResearchActivityTarget, SpyActivityTarget } from '../classes/activities';
import { AssetManager, ConstantAssets } from '../classes/assetManager';
import { EventEmitter, IEventEmitter } from '../classes/events';
import { GameData } from '../classes/gameIndex';
import { createGameList, createPlayer, createSinglePlayerMatch, getAssets} from './fakeServer';

export interface ActivityCost{
    resources:ResourceAmount[];
    time:number;
    duration?:string;
}
export interface Minimap{
    width:number;
    height:number;
    cells:number[];
}

export interface WorldMapQuery{
    p1:Vector;
    p2:Vector;
}

export interface WorldMapCell{
    position:Vector;
    cellId?:string;
}

export interface WorldPlayer{
    media:Media;
    playerId:string;
    techLevel?:number;
    buildings?:number;
    stockpiles?:Stockpile[];
}
export interface WorldMapSector{
    width:number;
    height:number;
    map:WorldMapCell[];
    players:WorldPlayer[]
}
export class ResourceStat{

    constructor(public resource:Resource,public stockpile:Stockpile,public placeables:PlaceableInstance[]){
    }

    get available():number{
        return this.stockpile.amount;
    }

    get totalIncome():number{
        if(this.placeables.length == 0 ) {
            return 0;
        }else {
            return this.placeables
                .map( p => p.instanceFlows)
                .flat()
                .filter( flow => flow.resourceId == this.resource.id && flow.amount >= 0)
                .map( flow => convertFlowToRPS(flow))
                .reduce( (prev,current) => prev+current , 0);
        }
    }
    get totalExpense():number{
        if(this.placeables.length == 0 ) {
            return 0;
        }else {
            return this.placeables
                .map( p => p.instanceFlows)
                .flat()
                .filter( flow => flow.resourceId == this.resource.id && flow.amount < 0)
                .map( flow => convertFlowToRPS(flow))
                .reduce( (prev,current) => prev+current , 0);
        }
    }

}

const flowPeriodRanges = new Map<FlowPeriodicity,number>( [
    [FlowPeriodicity.Once,0],
    [FlowPeriodicity.PerSecond,1000],
    [FlowPeriodicity.PerMinute,60000],
    [FlowPeriodicity.PerHour,3600000],
    [FlowPeriodicity.PerDay,86400000],
    [FlowPeriodicity.PerWeek,604800000],
]);

const MESSAGES_PER_PAGE = 25;

/**
 * Estima si los almacenes tendrán suficiente material para satisfacer
 * una demanda.
 * @param placeable 
 * @param stockpiles 
 * @returns 
 */
function hasEnoughSuppliesToWork(placeable:PlaceableInstance,stockpiles:Record<string,Stockpile>){
    return placeable.instanceFlows
        .filter( flow => flow.amount < 0)
        .every( flow => Math.abs(flow.amount) <= stockpiles[flow.resourceId].amount)
}
/**
 * Devuelve el número de recursos por segundo que produce un flujo
 * @param flow Flujo de recursos
 */
function convertFlowToRPS(flow:ResourceFlow):number{
    if(flow.periodicity == FlowPeriodicity.Once){
        return 0
    }else{
        //if(flow.amount > 0) console.log(flowPeriodRanges.get(flow.periodicity),flow,flow.amount / flowPeriodRanges.get(flow.periodicity)! / 1000);
        return flow.amount / (flowPeriodRanges.get(flow.periodicity)! / 1000);
    }
}

function generateMapImage():HTMLImageElement{
    return AssetManager.get(ConstantAssets.HEX_SELECTED).data;
}

function checkFlow(flow:ResourceFlow):number{
    let amount = 0;
    const now = Date.now();
    const elapsed = now - (flow.last||0);
    const maxElapsed = flowPeriodRanges.get(flow.periodicity) || 0;
   
    if(elapsed >= maxElapsed){
        amount = flow.amount
        flow.last = now;
    }
    
    return amount;
}

function unknownMedia(text:string):Media{
    return {
        description:'Desconocido',
        icon:{id:'unknown',type:'image',url:''},
        image:{id:'unknown',type:'image',url:''},
        thumbnail:{id:'unknown',type:'image',url:''},
        name:text
    }
}
/**
 * Esta interfaz define las operaciones que se llevan a cabo
 * en el lado del cliente
 */
export interface ILocalGameAPI{
    getCellInstance(cellInstanceId:number):CellInstance|undefined
    getGameData():GameData;
    getCurrentPlayer():InstancePlayer;
    checkActivityAvailability(type:ActivityType,target?:ActivityTarget):ActivityAvailability;
    getResearchedTechnologies():Technology[];
    getQueue():EnqueuedActivity[];
    getQueueByType(type:ActivityType):EnqueuedActivity[];
    /**
     * Métodos de obtención de información sobre elementos de juego
     */
    getTechnologyList():Technology[];
    getCell(id:string):Cell;
    getResource(id:string):Resource;
    getPlaceable(id:string):Placeable;
    getActivity(type:ActivityType):Activity;
    getActivityCost(type:ActivityType,target?:ActivityTarget):ActivityCost;
    getPlaceablesUnderConstruction(cellInstanceId:number):PlaceableInstance[];
    getUIConfig(): UIConfig
    getWorldMap(query:WorldMapQuery):WorldMapSector;

    calculateResourceStats():ResourceStat[];
}
/**
 * Esta interfaz define las operaciones que se llevan a cabo
 * en el lado del servidor
 */
export interface IRemoteGameAPI{
    authenticate(email:string,pass:string):Promise<Player>;
    joinGame(id:string):Promise<Asset[]>;
    getGameList():Promise<Partial<Game>[]>;
    getCells():Promise<CellInstance[]>;
    getInstancePlayer(id:string):Promise<Partial<InstancePlayer>>;
    startActivity(type:ActivityType,target:ActivityTarget):Promise<number|ActivityAvailability>;
    cancelActivity(id:number):Promise<void>;
    getMessages(text:string, type: MessageType, page: number): Promise<SearchResult<Message>>;
    sendTradeAgreement(agreement:TradingAgreement):Promise<number>;
    cancelTradeAgreement(id:number):Promise<void>;
    aceptTradeAgreement(id:number):Promise<void>;
    sendMessage(dstPlayerId:string,subject:string,message:string):Promise<Message>;
    deleteMessage(id:number):Promise<void>;
}

export interface IGameAPI extends ILocalGameAPI, IRemoteGameAPI, IEventEmitter{
    
}

export const GameEvents = {
    StockpileChanged:'stockpiles_changed',
    ActivityFinished:'activity_finished',
    CellInstanceUpdated:'cell_instance_updated',
    TechnologyResearched:'technology_researched',
    IncomingMessage:'incoming_message',
    Timer:'timer'
}

class MockAPI extends EventEmitter implements IGameAPI {
    private apiToken?:string;
    private currentPlayer?:Player;
    private currentInstancePlayer?:InstancePlayer;
    private currentGame?:GameData;
    private internalGame?:Game;
    private currentInstance?:GameInstance;
    private activityQueue:EnqueuedActivity[] = [];
    private timer:number;
    private queueInterval:number;
    private resourceCheckInterval:number;
    private lastQueueCheck:number;
    private playerMessages:Message[] = [];
    constructor(){
        super();
        this.timer = setInterval(this.ticker.bind(this),1000);
        this.queueInterval = setInterval(this.processQueue.bind(this),100);
        this.resourceCheckInterval = setInterval(this.processResourceFlows.bind(this),1000);
        this.lastQueueCheck = Date.now();
    }

    /**
     * Actualiza el contador de identificadores únicos de la instancia
     * y devuelve el siguiente. Los números en JS/TS tienen un rango 
     * de 2^63, lo que permite generar 292k identificadores únicos por 
     * segundo durante el próximo millón de años. Como este tiempo excede
     * el periodo de servicio de la aplicación, se puede dar por válido.
     * 
     * @returns Un número único a nivel de instancia.
     */
    private nextUUID():number{
        return ++this.currentInstance!.nextUUID;
    }

    private ticker():void{
        if(this.hasListener(GameEvents.Timer)){
            this.raise(GameEvents.Timer);
        }
    }

    private processResourceFlows():void{
        // Indexamos por id de recurso los almacenes
        const stockpileMap = toMap(this.getCurrentPlayer().stockpiles, sp => sp.resourceId);
        const stats = {
            buildingsWithoutProduction:0,
            totalProduction:0
        }
        for(const cell of this.currentInstance!.cells){

            for(const pInstance of cell.placeables){                
                // 1.- Puede el almacen funcionar con los recursos disponibles?
                if(hasEnoughSuppliesToWork(pInstance,stockpileMap)){
                    for(const flow of pInstance.instanceFlows){
                        const stockpile = stockpileMap[flow.resourceId];
                        const amount = checkFlow(flow);
                        if(amount != 0){
                            stockpile.amount += amount;
                            stats.totalProduction+=amount;
                        }
                    }
                }else{
                    //console.log('La instancia ',pInstance.id,'del emplazable',pInstance.placeableId,'no tiene recursos para producir');
                    stats.buildingsWithoutProduction++;
                }
            }
        }
        //console.log('Estadísticas de la producción',stats); 
    }
    private processQueue():void{
        const now = Date.now();

        let i = 0;
        let cummulativeTime = 0;
        const queueParallelActivities = this.currentInstancePlayer?.properties.queueParallelActivities || 0;
        
        while(i < this.activityQueue.length){
            const item = this.activityQueue[i];
            const activity = this.getActivity(item.type);
            
            if(item.elapsed>=activity.duration){
                const deleted = this.activityQueue.splice(i,1);
                // Gestionar el fin de actividad
                this.onActivityFinished(deleted[0]);
            }else{
                if(i < queueParallelActivities){
                    // Solo se actualiza el tiempo de aquellas
                    // tareas que la cola es capaz de procesar
                    if(!item.startedAt){
                        // Si la actividad comienza ahora, se establece
                        // la marca de tiempo de inicio.
                        item.startedAt = now;
                    }

                    item.elapsed += now - this.lastQueueCheck;
                    item.remaining = activity.duration - item.elapsed;
                }else{
                    // Ajustamos el tiempo restante para mostrar la cuenta atrás
                    // hasta su inicio
                    item.remaining = cummulativeTime;
                }
                
                console.log('Actividad',activity.type,'quedan',activity.duration-item.elapsed);
                cummulativeTime+=item.remaining;
            }

            i++;
        }

        this.lastQueueCheck = now;
    }


    private onActivityCreated(item:EnqueuedActivity):void{
        if(item.type == ActivityType.Build){
            /**
             * Cuando se inicia una actividad de construcción se añade automáticamente
             * el emplazable a la celda y se marca como inactivo. Al completar la actividad
             * se marca como activo. Mientras se encuentre inactivo los flujos no deben
             * procesarse.
             */
             this.buildInactivePlaceable(item.target as BuildingActivityTarget);
        }else if(item.type == ActivityType.Dismantle){
            // Ningun disparador previo
        }else if(item.type == ActivityType.Spy){
            // Ningun disparador previo
        }
    }
    private onActivityFinished(item:EnqueuedActivity):void{
        this.raise(GameEvents.ActivityFinished,item);
        if(item.type == ActivityType.Build){
            this.activatePlaceable(item.target as BuildingActivityTarget);
        }else if(item.type == ActivityType.Research){
            this.finishResearch(item.target as ResearchActivityTarget);
        }else if(item.type == ActivityType.Spy){
            this.createSpyReport(item.target as SpyActivityTarget);
        }else if(item.type == ActivityType.Dismantle){
            this.dismantleBuilding(item.target as DismantlingActivityTarget);
        }
    }

    private dismantleBuilding(target:DismantlingActivityTarget){
        this.removePlaceableInstance(target.cellInstanceId,target.placeableInstanceId);
    }

    private createSpyReport(target:SpyActivityTarget){
        const self = this.currentInstancePlayer;
        const opponent = this.currentInstance?.players.find(ip => ip.playerId = target.instancePlayerId);
        const success = self!.properties.spyAbility; // TODO Esto debe estar PRECALCULADO en la instancia
        const fail = opponent!.properties.spyAbility; // TODO Esto debe estar PRECALCULADO en la instancia

        // Es una comprobación un poco naive, pero es mejor no complicarse innecesariamente
        let report = {};

        if(success > fail){
            // Creamos el informe
            report = {
                success:true,
                properties : opponent!.properties,
                cells:opponent!.cells,
                technologies:opponent!.technologies,
                stockpiles:opponent!.stockpiles
            }
        }else{
            report = {
                success:false
            }
            console.log('Espionaje fracaso, no ves un pijo');
        }

        const notification:Message = {
            srcPlayerId:null,
            dstPlayerId:self!.playerId,
            subject:'Informe de espionaje a '+opponent!.media.name,
            type:MessageType.Report,
            sendAt:Date.now(),
            id:this.nextUUID(),
            senderName:self!.media.name,
            message:report
        }

        this.playerMessages.push(notification);
    }
    private onActivityCanceled(item:EnqueuedActivity):void{
        // Primero, devolver el coste de la actividad
        const stockPiles = toMap(this.getCurrentPlayer().stockpiles, sp => sp.resourceId);
        item.investment.forEach(expense => {
            stockPiles[expense.resourceId].amount+=expense.amount;
            this.raise<Stockpile>(GameEvents.StockpileChanged,stockPiles[expense.resourceId]);
        });

        if(item.type == ActivityType.Build){
            const target = item.target as BuildingActivityTarget;
            this.removePlaceableInstance(target.cellInstanceId,target.placeableInstanceId!);
        }
    }

    private finishResearch(target:ResearchActivityTarget){
        this.currentInstancePlayer?.technologies.push(target.techId);
        this.raise(GameEvents.TechnologyResearched,target.techId);
    }
    /**
     * Termina el ciclo de construcción de un edificio, permitiendo
     * que sus flujos y características se activen.
     * 
     * @param target Objetivo sobre el que actua la actividad
     */
    private activatePlaceable(target:BuildingActivityTarget){
        const cellInstance = this.currentInstance!.cells[target.cellInstanceId];
        const placeableInstance = cellInstance.placeables.find( pi => pi.id == target.placeableInstanceId);
        if(placeableInstance) {
            placeableInstance.built = true;
            this.raise(GameEvents.CellInstanceUpdated,cellInstance);
        }else{
            throw new Error('Error al activar, no se ha encontrado la instancia del emplazable');
        }
    }

    private buildInactivePlaceable(target:BuildingActivityTarget){
        const cellInstance = this.currentInstance!.cells[target.cellInstanceId];
        const placeable = this.currentGame!.placeables[target.placeableId];
        const placeableInstanceId = this.nextUUID();
        cellInstance.placeables.push({
            id:placeableInstanceId,
            built:false,
            instanceFlows:placeable?.flows.map( flow => ({...flow})), // Se copian los flujos del original al crear
            placeableId:target.placeableId
        });
        // Vinculamos el target con el recien creado edificio para
        // poder activarlo al terminar la tarea
        target.placeableInstanceId = placeableInstanceId;
        this.raise(GameEvents.CellInstanceUpdated,cellInstance);
    }

    /**
     * Elimina un emplazable de una celda
     * @param cellInstanceId Identificador de la celda
     * @param placeableInstanceId Identificador del emplazable
     */
    private removePlaceableInstance(cellInstanceId:number,placeableInstanceId:number){
        const cellInstance = this.currentInstance!.cells[cellInstanceId];
        const placeableInstance = cellInstance.placeables.find( pi => pi.id == placeableInstanceId);
        const placeable = this.currentGame?.placeables[placeableInstance!.placeableId];

        for(let i = 0; i <cellInstance.placeables.length; i++){
            if(cellInstance.placeables[i].id == placeableInstanceId){
                const deleted = cellInstance.placeables.splice(i,1);
                // 1.- Notificación de actualización de celda
                this.raise(GameEvents.CellInstanceUpdated,cellInstance);
                
                this.sendMessageToPlayer({
                    srcPlayerId:null,
                    dstPlayerId:this.currentInstancePlayer!.playerId,
                    message:'El emplazable '+placeable?.media.name+' ha sido desmantelado.',
                    subject:'Actividad finalizada',
                    type:MessageType.Notification,
                    sendAt:Date.now()
                });
                
                console.log('Se han eliminado los emplazables',deleted);
                break;
            }
        }
    }

    private sendMessageToPlayer(message:Message){
        // TODO En la API de servidor quitar el jugador local, 
        if(message.dstPlayerId == this.currentInstancePlayer!.playerId){
            this.playerMessages.push(message);
            this.raise(GameEvents.IncomingMessage,message.subject);
        }
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
    getCellInstance(cellInstanceId:number):CellInstance|undefined{
        if(!this.currentInstance) throw new Error('No se ha cargado la instancia de juego');
        return this.currentInstance.cells.find( cell => cell.id == cellInstanceId);
    }
    getGameData():GameData{
        if(!this.currentGame) throw new Error('No se ha cargado el juego');
        return this.currentGame;
    }
    getCurrentPlayer():InstancePlayer{
        if(!this.currentInstancePlayer) throw new Error('No se ha cargado la sesión del jugador');
        return this.currentInstancePlayer;
    }
    getInstancePlayer(id:string):Promise<Partial<InstancePlayer>>{
        if(!this.currentInstance) throw new Error('No se ha cargado la instancia');
        const found = this.currentInstance.players.find( player => player.playerId == id);
        return new Promise( (resolve,reject) => {
            resolve({
                media:found?.media,
                playerId:found?.playerId
            })
        });

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
        return this.currentGame.activities.get(type) || {
            type,
            media:unknownMedia('unknown activity'),
            expenses:[],
            duration:0,
            properties:{}
        } ;
    }
    getActivityCost(type:ActivityType,target?:ActivityTarget):ActivityCost{
        if(!this.currentGame) throw new Error('No se ha cargado el juego');
        // TODO El coste de la actividad puede (DEBE) depender del target
        // TIP: Añadir activityEffort a target?
        const activity = this.getActivity(type);
        return {
            resources:activity.expenses,
            time:activity.duration,
            duration:countdownStr(countdown(0,activity.duration))
        }
    }

    private getTechnologyDependencies(id:string):Technology[]{
        const deps:Technology[] = [];
        const tech = this.currentGame!.technologies[id];
        let parentId = tech.parent;

        while(parentId != null){
            const parent = this.currentGame!.technologies[parentId];
            deps.push(parent);
            parentId = parent?.parent;
        }

        return deps.reverse();
    }

    checkActivityAvailability(type:ActivityType,target?:ActivityTarget):ActivityAvailability{
        const failedPreconditions:string[] = [];
        const activity = this.getActivity(type);
        console.log('echecking')    ;
        // Es necesaria alguna tecnología para comenzar la actividad?
        if(activity.requiredTech){
            const requiredTech = this.currentGame?.technologies[activity.requiredTech];
            const researchedTechs = this.getResearchedTechnologies();
            if(!researchedTechs.some( tech => tech.id == requiredTech?.id)){
                failedPreconditions.push('Se necesita '+requiredTech?.media.name+' para llevar a cabo esta actividad');
            }
        }
        // Comprobamos que hay suficiente para empezar
        const stockPiles = toMap(this.getCurrentPlayer().stockpiles, sp => sp.resourceId);
        // No se puede construir si al menos un almacen tiene menos stock que lo que el flujo requiere
        activity.expenses.forEach( expense => {
            if(expense.amount >= stockPiles[expense.resourceId].amount){
                const resource = this.currentGame?.resources[expense.resourceId];
                failedPreconditions.push('Faltan '+ (expense.amount-stockPiles[expense.resourceId].amount)+' de '+resource?.media.name);
            }
        });
        
        // Si es una tecnología concreta:
        if(type == ActivityType.Research){
            // Debe estar sin investigar
            const techId = (target as ResearchActivityTarget).techId;
            if(this.currentInstancePlayer?.technologies.some( t => t == techId)){
                failedPreconditions.push('Esta tecnología ya está investigada')
            }
            // No debe estar en cola
            if(this.activityQueue.some( ea => ea.type == ActivityType.Research && (ea.target as ResearchActivityTarget).techId == techId)){
                failedPreconditions.push('Esta tecnología ya está en cola de investigación');
            }
            // Todo el arbol tecnologico previo debe estar desbloqueado
            const depTree = this.getTechnologyDependencies(techId);
            if(depTree.some( dep => this.currentInstancePlayer?.technologies.indexOf(dep.id) == -1)){
                failedPreconditions.push('Es necesario investigar una tecnología previa');
            }
        }else if(type == ActivityType.Dismantle){
            // El emplazable no debe estar involucrado en otra actividad de desmantelamiento
            const dismantlingTarget = (target as DismantlingActivityTarget);
            const beingDismantled = this.getQueueByType(ActivityType.Dismantle).find( ea => {
                const eaTarget = ea.target as DismantlingActivityTarget;
                if(eaTarget.cellInstanceId == dismantlingTarget.cellInstanceId && eaTarget.placeableInstanceId == eaTarget.placeableInstanceId){
                    return ea;
                }
            });

            if(beingDismantled){
                failedPreconditions.push('El emplazable ya está siendo desmantelado');
            }
        }

        return {
            available:failedPreconditions.length == 0,
            target,
            type,
            info:failedPreconditions
        }
    }

    getQueue():EnqueuedActivity[]{
        return this.activityQueue;
    }
    getQueueByType(type:ActivityType):EnqueuedActivity[]{
        return this.activityQueue.filter( item => item.type == type);
    }
    startActivity(type:ActivityType,target:ActivityTarget):Promise<number>{        
        return new Promise( (resolve,reject) => {
            const availability = this.checkActivityAvailability(type,target);
            if(availability.available){
                const activity = this.getActivity(type);
                const cost = this.getActivityCost(type,target);

                const activityId = this.nextUUID();
                const item:EnqueuedActivity = {
                    id:activityId,
                    target,
                    name:activity.media.name + ' ' + target.name,
                    enqueuedAt:Date.now(),
                    investment:cost.resources,
                    type,
                    elapsed:0,
                    remaining:cost.time
                };
                
                
                this.activityQueue.push(item);
                // Descontar el coste de la actividad
                const stockPiles = toMap(this.getCurrentPlayer().stockpiles, sp => sp.resourceId);
                
                cost.resources.forEach(expense => {
                    stockPiles[expense.resourceId].amount-=expense.amount;
                    this.raise<Stockpile>(GameEvents.StockpileChanged,stockPiles[expense.resourceId]);
                });
    
                this.onActivityCreated(item);
                
                resolve(item.id);
            }else{
                reject(availability);
            }
            
        });
    }

    cancelActivity(id: number): Promise<void> {
        return new Promise( (resolve,reject) => {
            let removedActivity = null;
            for(let i = 0; i < this.activityQueue.length; i++){
                if(this.activityQueue[i].id == id){
                    removedActivity = this.activityQueue.splice(i,1)[0];
                    break;
                }
            }

            if(removedActivity){
                this.onActivityCanceled(removedActivity);
                resolve();    
            }else{
                reject('No se ha encontrado la actividad en la cola');
            }
            
        })
        
    }

    private getPlayerPosition(id:string):Vector{
        if(!this.currentInstance) throw new Error('La instancia de juego no está cargada')
        const pos = new Vector(0,0);
        let numCells = 0;
        for(const cell of this.currentInstance.cells){
            if(cell.playerId == id){
                pos.add(cell.position);
                numCells++;
            }
        }
        return pos.multiply(1/numCells); // Divide el vector por el número de celdas, obteniendo el centro de masas
    }
    getWorldMap(query: WorldMapQuery): WorldMapSector {
        if(!this.currentInstance) throw new Error('La instancia de juego no está cargada')
        const playerMap:Record<string,WorldPlayer> = {};
        const w = query.p2.x-query.p1.x;
        const h = query.p2.y-query.p1.y;
        const sector:WorldMapSector = {
            map:[],
            height:h,
            width:w,
            players:[]
        }

        for(let y = query.p1.y; y < query.p2.y; y++){
            for(let x = query.p1.x; x < query.p2.x; x++){
                // Referencia a la instancia de celda sobre la que se itera
                // en caso de que esté dentro de los limites del mapa
                if(x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE){
                    const cell = this.currentInstance.cells[y*MAP_SIZE+x];
                    // Si la celda que cae en el sector tiene propietario, este
                    // debe aparecer en la lista de jugadores
                    if(cell.playerId !=null){
                        if(!playerMap[cell.playerId]){
                            // A la primera aparición, se añade a la lista
                            playerMap[cell.playerId] = {
                                playerId:cell.playerId,
                                media:this.currentInstance.players.find( player => player.playerId == cell.playerId)!.media
                            }
                        }
                    }
                    sector.map.push({
                        position:cell.position,
                        cellId:cell.cellId
                    });
                }else{
                    sector.map.push({
                        position:new Vector(x,y)
                    }); 
                }  
            }
        }
        
        const currentPlayer = this.currentInstance.players.find(p => p.playerId == this.currentInstancePlayer!.playerId)!;

        // Se mapean los jugadores a partir de los descriptores de jugador recolectados
        // TODO: Esto es un MOCK, cuando migres al servidor usa los jugadores reales de
        // la coleccion players
        sector.players = Object.entries(playerMap).map( entry => entry[1] );

        return sector;
        
    }
    
    calculateResourceStats():ResourceStat[] {
        if(!this.currentGame) throw new Error('No se ha cargado el juego');
        if(!this.currentInstancePlayer) throw new Error('No se ha cargado la sesión del jugador');
        if(!this.currentInstance) throw new Error('No se ha cargado la instancia del juego');

        const stockpiles = toMap(this.currentInstancePlayer.stockpiles, sp => sp.resourceId);
        const builtPlaceables = this.currentInstance.cells
            .map( cell => cell.placeables)
            .flat()
            .filter( placeable => hasEnoughSuppliesToWork(placeable,stockpiles));
            
        
        const stats:ResourceStat[] = Object
            .entries(this.currentGame.resources)
            .map( entry => entry[1])
            .sort( (a,b) => a.media.name > b.media.name ? 1 : -1)
            .map( resource => new ResourceStat(resource,stockpiles[resource.id],builtPlaceables));

        return stats;
    }

    sendTradeAgreement(agreement:TradingAgreement):Promise<number>{
        return new Promise( (resolve,reject) => {
            // TODO Esto es una funcionalidad integra del servidor
            
            // 1.- Añadir a la lista de tratos comerciales pendientes de aceptar en la instancia
            agreement.id = this.nextUUID();
            this.currentInstance?.pendingTradingAgreements.push(agreement);
            
            // 2.- Generar la notificación para el oponente
            // TODO Esto no está siquiera disponible en el cliente
            // 3.- Generar la notificación para el emisor
            this.sendMessageToPlayer({
                id:this.nextUUID(),
                message:agreement,
                dstPlayerId:this.currentInstancePlayer!.playerId,
                type:MessageType.Notification,
                subject:"Nuevo tratado comercial",
                srcPlayerId:null
            });

            resolve( agreement.id );
        });
    }

    cancelTradeAgreement(id:number):Promise<void>{
        return new Promise( (resolve,reject) => {
            reject('POR HACER');
        })
    }
    aceptTradeAgreement(id:number):Promise<void>{
        return new Promise( (resolve,reject) => {
            reject('POR HACER');
        })
    }

    getMessages(text:string, type: MessageType, page: number): Promise<SearchResult<Message>> {
        if(this.playerMessages.length == 0){
            // Asignamos unos cuantos aleatorios
            // TODO En el backend esto deb recuperar los DE VERDAD
            /*range(randomInt(500)).forEach( i => {
                const emitter = randomItem(this.currentInstance!.players);
                const type = randomItem([MessageType.Message,MessageType.Notification,MessageType.Report]);
                this.playerMessages.push({
                    id:this.nextUUID(),
                    dstPlayerId:this.currentInstancePlayer!.playerId,
                    message:randomText(100),
                    senderName:emitter.media.name,
                    readedAt:null,
                    sendAt:Date.now(),
                    srcPlayerId:emitter.playerId,
                    subject:`msg ${i} of type ${type}`+randomText(10),
                    type:type
                });
            })*/
        }
        console.log('Buscando mensajes de jugador',text,type,page)
        const offset = MESSAGES_PER_PAGE * (page-1); // aunque el cliente usa el rango [1,n], la api usa [0,n) o [0,n-1]
        const found = this.playerMessages.filter( msg => msg.type == type && msg.subject.indexOf(text) >= 0);
        const result:SearchResult<Message> = {
             count:found.length,
             page,
             pages: Math.ceil(found.length / MESSAGES_PER_PAGE),
             results: found.slice(offset,offset+MESSAGES_PER_PAGE)
        }
        
        return new Promise( (resolve,reject) => {
            resolve(result);
        });
    }

    sendMessage(dstPlayerId:string,subject:string,message:string):Promise<Message>{
        if(!this.currentInstancePlayer) throw new Error('No se ha cargado la sesión del jugador');
        const msg:Message = {
            type:MessageType.Message,
            dstPlayerId,
            message,
            srcPlayerId:this.currentInstancePlayer?.playerId,
            subject,
            sendAt:Date.now(),
            senderName: this.currentInstancePlayer.media.name
        }
        this.playerMessages.push(msg);
        return new Promise( (resolve,reject) => resolve(msg));
    }
    
    deleteMessage(id:number):Promise<void>{
        return new Promise( (resolve,reject) => {
            for(let i = 0; i< this.playerMessages.length; i++){
                if(this.playerMessages[i].id == id){
                    this.playerMessages.splice(i,1);
                    break;
                }
            }
            resolve();
        });
    }

    getPlaceablesUnderConstruction(cellInstanceId: number): PlaceableInstance[] {
        if(!this.currentInstance) throw new Error('No se ha cargado la instancia del juego');

        const cellInstance = this.currentInstance.cells[cellInstanceId];
        const placeableInstances:PlaceableInstance[] = [];
        const buildingActivities = this
            .getQueueByType(ActivityType.Build)
            .filter( ea => (ea.target as BuildingActivityTarget).cellInstanceId == cellInstanceId);

        buildingActivities.forEach( ea => {
            const target = ea.target as BuildingActivityTarget;
            const placeable = cellInstance.placeables.find( pi => pi.id == target.placeableInstanceId);
            if(placeable){
                placeableInstances.push()
            }
        });

        return placeableInstances;
    }
}

let api:IGameAPI|null;

export function useGameAPI(){
    if(!api){
        api = new MockAPI();
    }

    return api;
}
