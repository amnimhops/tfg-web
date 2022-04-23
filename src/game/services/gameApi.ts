import { limit, randomInt, randomItem, range, toMap } from 'shared/functions';
import { MAP_SIZE, randomText } from 'shared/mocks';
import { Activity, ActivityTarget, ActivityType, Asset, Cell, CellInstance, EnqueuedActivity, FlowPeriodicity, Game, GameInstance, InstancePlayer, Media, Message, MessageType, Placeable, PlaceableInstance, Player, Resource, ResourceAmount, ResourceFlow, SearchResult, Stockpile, Technology, UIConfig, Vector } from 'shared/monolyth';
import { ActivityAvailability, BuildingActivityTarget, ResearchActivityTarget } from '../classes/activities';
import { AssetManager, ConstantAssets } from '../classes/assetManager';
import { EventEmitter, IEventEmitter } from '../classes/events';
import { GameData } from '../classes/gameIndex';
import { createGameList, createPlayer, createSinglePlayerMatch, getAssets} from './fakeServer';

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
    id:string;
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
 * la demanda de un edificio.
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
export interface IGameAPI extends IEventEmitter{
    authenticate(email:string,pass:string):Promise<Player>;
    joinGame(id:string):Promise<Asset[]>;
    getGameList():Promise<Partial<Game>[]>;
    getCells():Promise<CellInstance[]>;
    getGameData():GameData;
    getCurrentPlayer():InstancePlayer;
    getInstancePlayer(id:string):Promise<Partial<InstancePlayer>>;
    startActivity(type:ActivityType,target:ActivityTarget):Promise<string>
    checkActivityAvailability(type:ActivityType,target:ActivityTarget):ActivityAvailability;
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
    getUIConfig(): UIConfig
    getWorldMap(query:WorldMapQuery):WorldMapSector;

    calculateResourceStats():ResourceStat[];

    getMessages(text:string, type: MessageType, page: number): Promise<SearchResult<Message>>;
    deleteMessage(id:string):Promise<void>;

}

export const GameEvents = {
    StockpileChanged:'stockpiles_changed',
    ActivityFinished:'activity_finished',
    CellInstanceUpdated:'cell_instance_updated',
    TechnologyResearched:'technology_researched',
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
        this.raise(GameEvents.ActivityFinished,item);
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
        const placeable = this.currentGame!.placeables[target.placeableId];
        cellInstance.placeables.push({
            id:-1,
            instanceFlows:placeable?.flows.map( flow => ({...flow})), // Se copian los flujos del original al crear
            placeableId:target.placeableId
        });
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
        const stockPiles = toMap(this.getCurrentPlayer().stockpiles, sp => sp.resourceId);
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
    getQueueByType(type:ActivityType):EnqueuedActivity[]{
        return this.activityQueue.filter( item => item.type == type);
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
        const stockPiles = toMap(this.getCurrentPlayer().stockpiles, sp => sp.resourceId);
        activity.flows.forEach(flow => {
            stockPiles[flow.resourceId].amount-=Math.abs(flow.amount);
            this.raise<Stockpile>(GameEvents.StockpileChanged,stockPiles[flow.resourceId]);
        });


        return new Promise( (resolve,reject) => setTimeout( ()=> resolve(item.id) , 1000));
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
                                id:cell.playerId,
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

    getMessages(text:string, type: MessageType, page: number): Promise<SearchResult<Message>> {
        if(this.playerMessages.length == 0){
            // Asignamos unos cuantos aleatorios
            // TODO En el backend esto deb recuperar los DE VERDAD
            range(randomInt(500)).forEach( i => {
                const emitter = randomItem(this.currentInstance!.players);
                const type = randomItem([MessageType.Message,MessageType.Notification,MessageType.Report]);
                this.playerMessages.push({
                    id:`message-${i}`,
                    dstPlayerId:this.currentInstancePlayer!.playerId,
                    message:randomText(100),
                    readedAt:null,
                    sendAt:Date.now(),
                    srcPlayerId:emitter.playerId,
                    subject:`msg ${i} of type ${type}`+randomText(10),
                    type:type
                });
            })
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

    deleteMessage(id:string):Promise<void>{
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
}

let api:IGameAPI|null;

export function useGameAPI(){
    if(!api){
        api = new MockAPI();
    }

    return api;
}
