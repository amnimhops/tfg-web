import { countdown, countdownStr, fmtResourceAmount, toMap } from 'server/functions';
import { Activity, ActivityTarget, ActivityType, Asset, Cell, CellInstance, EnqueuedActivity, flowPeriodRanges, Game, GameEvents, GameStats, InstancePlayer, InstancePlayerInfo, Media, Message, MessageType, Placeable, PlaceableInstance, RegistrationRequest, Resource, ResourceFlow, SearchParams, SearchResult, Stockpile, Technology, TileConfig, TradingAgreement, UIConfig, User, WithToken, WorldMapQuery, WorldMapSector } from 'server/monolyth';
import { AssetManager, ConstantAssets } from 'server/assets';
import { ActivityAvailability, ActivityCost, AttackActivityTarget, ClaimActivityTarget, DismantlingActivityTarget, ExplorationActivityTarget, ResearchActivityTarget } from 'server/activities';
import { EventEmitter, IEventEmitter } from '../classes/events';

import { GameData } from 'server/gamedata';
import { RemoteApiClient } from './remoteApiClient';
import { IRemoteGameAPI } from './remoteApi';

export {GameEvents} from 'server/monolyth';

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
    return flow.amount / (flowPeriodRanges.get(flow.periodicity)! / 1000);
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
    authenticate(email:string,pass:string):Promise<WithToken<User>>;
    joinGame(id:string):Promise<Asset[]>;
    validateUser(user:User):Promise<Record<string,string>>;
    gameStats(id:string):Promise<GameStats>;
    register(request:RegistrationRequest):Promise<WithToken<User>>;
    setToken(id:string):void;
    getGameData():GameData;
    getGameList():Promise<Partial<Game>[]>;
    getCells():Promise<CellInstance[]>;
    getInstancePlayer(id:string):Promise<Partial<InstancePlayer>>;
    getSelfPlayer():Promise<InstancePlayer>;
    getWorldMap(query:WorldMapQuery):Promise<WorldMapSector>;
    startActivity(type:ActivityType,target:ActivityTarget):Promise<number>;
    changeActivityOrder(id: number, offset: number): Promise<void>;
    cancelActivity(id: number): Promise<void>;
    sendTradeAgreement(agreement:TradingAgreement):Promise<string>;
    cancelTradeAgreement(id:number):Promise<void>;
    acceptTradeAgreement(id:number):Promise<void>;
    getTradeAgreement(id:number):Promise<TradingAgreement>;
    getMessages(text:string, type: MessageType, page: number): Promise<SearchResult<Message>>;
    sendMessage(dstPlayerId:string,subject:string,message:string):Promise<Message>;
    deleteMessage(id:number):Promise<void>;
    getCellInstance(cellInstanceId:number):CellInstance|undefined;
    getCurrentPlayer():InstancePlayer;
    getCell(id:string):Cell;
    getResource(id:string):Resource;
    getPlaceable(id:string):Placeable;
    getTechnologyList():Technology[];
    getUIConfig(): UIConfig;
    getTileConfig(): TileConfig;
    getResearchedTechnologies():Technology[];
    getActivity(type:ActivityType):Activity;
    getActivityCost(type:ActivityType,target?:ActivityTarget):ActivityCost;
    checkActivityAvailability(type:ActivityType,target?:ActivityTarget):ActivityAvailability;
    getQueue():EnqueuedActivity[];
    getQueueByType(type:ActivityType):EnqueuedActivity[];
    calculateResourceStats():ResourceStat[];
    searchGames(params:SearchParams):Promise<SearchResult<Partial<Game>>>;
    logout(): Promise<WithToken<User>>;
    instanceInfo(id:string):Promise<InstancePlayerInfo[]>;
}

export interface IGameAPI extends ILocalGameAPI, IEventEmitter{
    
}

class LocalGameAPI extends EventEmitter implements IGameAPI {
    private currentInstancePlayer?:InstancePlayer;
    private cells:Map<number,CellInstance> = new Map();
    private currentGame?:GameData;
    private internalGame?:Game;
    private activityQueue:EnqueuedActivity[] = [];
    private traceSocketMessages = false;
    private queueInterval = 0;
    private timer:number;
    private lastQueueCheck = 0;
    private remoteApi:IRemoteGameAPI;
    ws?:WebSocket; 
   
    constructor(){
        super();
        this.timer = 0;       
        this.remoteApi = new RemoteApiClient(process.env.VUE_APP_REST_ENDPOINT);
    }

    processQueue(){
        const now = Date.now();
        
        this.activityQueue.forEach( ea => {
            const elapsed = now - this.lastQueueCheck;
            ea.remaining = Math.max(0, (ea.remaining||0) - elapsed);
        });
        this.lastQueueCheck = now;
        this.raise(GameEvents.Timer,{});
    }
    connectWS(token:string){
        this.ws = new WebSocket(process.env.VUE_APP_WS_ENDPOINT+'?token='+token);

        this.ws.onopen = (event)=>{
            console.log('Websocket abierto',event);
        }
        this.ws.onmessage = (e:MessageEvent)=>{
            if(this.traceSocketMessages) console.log('Websocket msg recibido',e);
            const event = JSON.parse(e.data);
            if(event.type){
                this.raise(event.type,event.data)
                /**
                 * La API de cliente, ademas de retransmitir lo que
                 * ocurra en servidor, debe sincronizar los cambios
                 * con el estado local
                 */
                if(event.type == GameEvents.StockpilesChanged){
                    this.currentInstancePlayer!.stockpiles = event.data as Stockpile[];
                }else if(event.type == GameEvents.CellInstanceUpdated){
                    const cell = event.data as CellInstance;
                    this.cells.set(cell.id,cell);
                }else if(event.type == GameEvents.PlayerInstanceUpdated){
                    const player = event.data as InstancePlayer;
                    this.currentInstancePlayer = player;
                }else if(event.type == GameEvents.TechnologyResearched){
                    const techId = event.data as string;
                    this.currentInstancePlayer?.technologies.push(techId);
                }else if(
                    event.type == GameEvents.ActivityEnqueued || 
                    event.type == GameEvents.ActivityUpdated ||
                    event.type == GameEvents.ActivityFinished ||
                    event.type == GameEvents.ActivityCanceled){
                    
                    this.remoteApi.getQueue().then( queue => this.activityQueue = queue );
                }
            }
        }
        this.ws.onerror = (event)=>{
            console.error('Websocket error recibido',event)
        }
        this.ws.onclose = (event)=>{
            console.log('Websocket cerrando',event)
        }
    }
    validateUser(user:User):Promise<Record<string,string>>{
        return this.remoteApi.validateUser(user);
    }
    private ticker():void{
        if(this.hasListener(GameEvents.Timer)){
            this.raise(GameEvents.Timer);
        }
    }

    async authenticate(email:string,pass:string):Promise<WithToken<User>>{
        const authorizedUser = await this.remoteApi.authenticate(email,pass);
        this.setToken(authorizedUser.token);
        return authorizedUser;
    }

    async register(request:RegistrationRequest):Promise<WithToken<User>>{
        try{
            console.log('www')
            const authorizedUser = await this.remoteApi.register(request);
            this.setToken(authorizedUser.token);
            return authorizedUser;
        }catch(err){
            console.log(err);
            throw err;
        }
    }

    setToken(token:string):void{
        this.remoteApi.setToken(token);
        this.connectWS(token);
    }

    async joinGame(id:string):Promise<Asset[]>{
        const assets = await this.remoteApi.joinGame(id);
        this.currentInstancePlayer = await this.remoteApi.getSelfPlayer();
        this.internalGame = await this.remoteApi.getGame();
        console.log(assets);
        console.log(this.internalGame);
        this.currentGame = new GameData(this.internalGame); // Esta vista mejora con índices a internalGame
        this.activityQueue = await this.remoteApi.getQueue();

        const cells = await this.remoteApi.getCells();
        /**
         * En el servidor las celdas se indexan por índice dentro del array
         * de celdas de la instancia, pero esto no sirve en el cliente, ya
         * que cada jugador recibe un subset de este array.
         */
        cells.forEach( cell => this.cells.set(cell.id,cell));
        this.queueInterval = setInterval(this.processQueue.bind(this),250);
        this.lastQueueCheck = Date.now();

        return assets;
    }

    gameStats(id:string):Promise<GameStats>{
        return this.remoteApi.gameStats(id);
    }

    getGameData():GameData{
        if(!this.currentGame) throw new Error('No se han cargado los datos del juego');
        return this.currentGame
    }
    getGameList():Promise<Partial<Game>[]>{
        return this.remoteApi.getGameList();
    }
    getCells():Promise<CellInstance[]> {
        return this.remoteApi.getCells();
    }
    getInstancePlayer(id:string):Promise<Partial<InstancePlayer>>{
        return this.remoteApi.getInstancePlayer(id);
    }
    getSelfPlayer():Promise<InstancePlayer>{
        return this.remoteApi.getSelfPlayer();
    }
    getWorldMap(query:WorldMapQuery):Promise<WorldMapSector>{
        return this.remoteApi.getWorldMap(query);
    }
    async startActivity(type:ActivityType,target:ActivityTarget):Promise<number>{    
        const ea = await this.remoteApi.startActivity(type,target);
        return ea.id;
    }
    async changeActivityOrder(id: number, offset: number): Promise<void> {
        // El cambio de orden no se puede reflejar solo con 
        // los updates de los elementos individuales, hay que
        // traerse la cola entera
        await this.remoteApi.changeActivityOrder(id,offset);
        this.activityQueue = await this.getQueue();
    }
    async cancelActivity(id: number): Promise<void> {
       return this.remoteApi.cancelActivity(id);
    }
    sendTradeAgreement(agreement:TradingAgreement):Promise<string>{
        return this.remoteApi.sendTradeAgreement(agreement);
    }
    cancelTradeAgreement(id:number):Promise<void>{
        return this.remoteApi.cancelTradeAgreement(id);
    }
    acceptTradeAgreement(id:number):Promise<void>{
        return this.remoteApi.acceptTradeAgreement(id);
    }
    getTradeAgreement(id:number):Promise<TradingAgreement>{
        return this.remoteApi.getTradeAgreement(id);
    }
    getMessages(text:string, type: MessageType, page: number): Promise<SearchResult<Message>> {
        return this.remoteApi.getMessages(text,type,page);
    }
    sendMessage(dstPlayerId:string,subject:string,message:string):Promise<Message>{
        return this.remoteApi.sendMessage(dstPlayerId,subject,message);
    }
    deleteMessage(id:number):Promise<void>{
        return this.remoteApi.deleteMessage(id);
    }

    getCellInstance(cellInstanceId:number):CellInstance|undefined{
        return this.cells.get(cellInstanceId);
    }
    
    getCurrentPlayer():InstancePlayer{
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
        return this.internalGame!.userInterface!.style!; // bang bang!
    }
    getTileConfig(): TileConfig {
        return this.internalGame!.userInterface!.tiles!;
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
    // TODO Esto debería estar en el servidor? Se llama con frecuencia, ¿merece la pena hacer cómputo doble?
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
        // Es importante CALCULAR los costes en lugar de acceder directamente
        const cost = this.getActivityCost(type,target);
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
        cost.resources.forEach( expense => {
            if(expense.amount > stockPiles[expense.resourceId].amount){
                const resource = this.currentGame?.resources[expense.resourceId];
                failedPreconditions.push('Faltan '+ fmtResourceAmount(expense.amount-stockPiles[expense.resourceId].amount)+' de '+resource?.media.name);
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
        }else if(type == ActivityType.Attack){
            /**
             * Las misiones de ataque tienen recursos adicionales en el target, hay que comprobar
             * que, además el coste, los almacenes pueden soportar el gasto adicional.
             */
            const attackTarget = target as AttackActivityTarget;
            const attachedResources = toMap(attackTarget.resources, res => res.resourceId);
            const costMap = toMap(cost.resources, res => res.resourceId);
            
            attackTarget.resources.forEach (res => {
                /**
                 * Si el recurso está presente en el coste base de la actividad, comprobar que la
                 * cantidad combinada es compatible con el stock. De lo contrario, solo comprobar
                 * el almacen
                 */
                let extra = 0;
                if(costMap[res.resourceId] !== undefined){
                    extra = costMap[res.resourceId].amount;
                }
                
                if(extra + res.amount > stockPiles[res.resourceId].amount){
                    const resource = this.currentGame?.resources[res.resourceId];
                    failedPreconditions.push('Faltan '+ (res.amount+extra-stockPiles[res.resourceId].amount)+' de '+resource?.media.name);
                }
            });
        }else if(type == ActivityType.Explore){
            const explorationTarget = (target as ExplorationActivityTarget);
            const beingExplored = this.getQueueByType(ActivityType.Explore).find( ea => {
                const eaTarget = ea.target as ExplorationActivityTarget;
                return eaTarget.cellInstanceId == explorationTarget.cellInstanceId;
            });

            if(beingExplored){
                failedPreconditions.push('Este área ya se está explorando');
            }
        }else if(type == ActivityType.Claim){
            const claimTarget = (target as ClaimActivityTarget);
            const placeableInstance = this.cells.get(claimTarget.cellInstanceId);
            if(!placeableInstance!.playerId){
                const beingClaimed = this.getQueueByType(ActivityType.Claim).find( ea => {
                    const eaTarget = ea.target as ClaimActivityTarget;
                    return eaTarget.cellInstanceId == claimTarget.cellInstanceId;
                });

                if(beingClaimed){
                    failedPreconditions.push('Este área ya se está incorporando');
                }
            }else if(placeableInstance!.playerId == this.currentInstancePlayer?.playerId){
                failedPreconditions.push('Este área ya es del jugador');
            }else if(placeableInstance!.playerId != this.currentInstancePlayer?.playerId){
                failedPreconditions.push('Este área pertenece a otro jugador');
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
    
    calculateResourceStats():ResourceStat[] {
        if(!this.currentGame) throw new Error('No se ha cargado el juego');
        if(!this.currentInstancePlayer) throw new Error('No se ha cargado la sesión del jugador');
        if(!this.cells) throw new Error('No se ha cargado la instancia del juego');

        const stockpiles = toMap(this.currentInstancePlayer.stockpiles, sp => sp.resourceId);
        const builtPlaceables = this.currentInstancePlayer.cells
            .map( cellId => this.getCellInstance(cellId)?.placeables||[])
            .flat()
            .filter( placeable => hasEnoughSuppliesToWork(placeable,stockpiles));
            
        
        const stats:ResourceStat[] = Object
            .entries(this.currentGame.resources)
            .map( entry => entry[1])
            .sort( (a,b) => a.media.name > b.media.name ? 1 : -1)
            .map( resource => new ResourceStat(resource,stockpiles[resource.id],builtPlaceables));

        return stats;
    }

    searchGames(params:SearchParams):Promise<SearchResult<Partial<Game>>>{
        return this.remoteApi.searchGames(params);
    }

    logout(): Promise<WithToken<User>> {
        return this.remoteApi.logout();
    }

    instanceInfo(id:string):Promise<InstancePlayerInfo[]>{
        return this.remoteApi.instanceInfo(id);
    }
}

let api:IGameAPI|null;
let config:{
    restEndpoint:string,
    wsEndpoint:string
}

export function useGameAPI(){
    if(!api){
        api = new LocalGameAPI();
    }
    // Por algun motivo que desconozco, las variables de entorno inyectadas
    // desde vue/webpack no son visibles en el depurador. Tres horas perdidas
    // de mi vida...
    console.log(process.env.VUE_APP_REST_ENDPOINT,process.env.VUE_APP_WS_ENDPOINT);
    return api;
}