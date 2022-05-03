import { Instance } from '@popperjs/core';
import { countdown, countdownStr, randomInt, randomItem, range, toMap } from '@/shared/functions';
import { MAP_SIZE, randomText } from '@/shared/mocks';
import { Activity, ActivityTarget, ActivityType, Asset, Cell, CellInstance, ConstantProperties, EnqueuedActivity, FlowPeriodicity, Game, GameEvents, GameInstance, InstancePlayer, Media, Message, MessageContentType, MessageType, Placeable, PlaceableInstance, Player, Properties, Resource, ResourceAmount, ResourceFlow, SearchResult, SpyReport, Stockpile, Technology, TradingAgreement, UIConfig, Vector, WithAmount } from '@/shared/monolyth';
import { ActivityAvailability, AttackActivityTarget, BuildingActivityTarget, ClaimActivityTarget, DismantlingActivityTarget, ExplorationActivityTarget, ResearchActivityTarget, SpyActivityTarget } from '../classes/activities';
import { AssetManager, ConstantAssets } from '../classes/assetManager';
import { CombatPlayer, CombatResult, CombatUnit, CombatUnitInfo, createCombatSummary } from '../classes/combat';
import { EventEmitter, IEventEmitter } from '../classes/events';
import { fmtResourceAmount } from '../classes/formatters';
import { GameData } from '../classes/gameIndex';
import { createGameList, createPlayer, createSinglePlayerMatch, getAssets} from './fakeServer';

export {GameEvents} from '@/shared/monolyth';

const apiEndpoint = 'http://localhost:3000/';

interface PropertyCalculationParams{
    cells:boolean;
    placeables:boolean;
    technologies:boolean;
    stockpiles:boolean;
}

function combineProperties(a:Properties,b:Properties):Properties{
    const props:Properties = {};

    // Asignar todas las propiedades de 'a' al nuevo objeto
    Object.keys(a).forEach( key => props[key] = a[key]);
    // Asignar todas las propiedades de 'b' que no estén en 'a' y sumar las comunes
    Object.keys(b).forEach( key => {
        if(props[key] !== undefined){
            props[key] += b[key];
        }else{
            props[key] = b[key];
        }
    });

    return props;
}
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
    playerId?:string;
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
 * en el lado del servidor, serán implementadas por el cliente
 * de comunicaciones.
 */
export interface IRemoteGameAPI{
    authenticate(email:string,pass:string):Promise<Player>;
    joinGame(id:string):Promise<Asset[]>;
    getGameList():Promise<Partial<Game>[]>;
    getCells():Promise<CellInstance[]>;
    getInstancePlayer(id:string):Promise<Partial<InstancePlayer>>;
    startActivity(type:ActivityType,target:ActivityTarget):Promise<number|ActivityAvailability>;
    cancelActivity(id:number):Promise<void>;
    changeActivityOrder(id:number,index:number):Promise<void>;
    getMessages(text:string, type: MessageType, page: number): Promise<SearchResult<Message>>;
    sendTradeAgreement(agreement:TradingAgreement):Promise<number>;
    cancelTradeAgreement(id:number):Promise<void|string>;
    acceptTradeAgreement(id:number):Promise<void>;
    tradeAgreementActive(id:number):Promise<boolean>;
    sendMessage(dstPlayerId:string,subject:string,message:string):Promise<Message>;
    deleteMessage(id:number):Promise<void>;
}

export interface IGameAPI extends ILocalGameAPI, IRemoteGameAPI, IEventEmitter{
    
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
        
        
        const stats = {
            buildingsWithoutProduction:0,
            totalProduction:0
        }
        this.currentInstance!.players.forEach( player => {
            // Indexamos por id de recurso los almacenes 
            const stockpileMap = toMap(player.stockpiles, sp => sp.resourceId);
            player.cells.forEach( cellId => {
                const cell = this.currentInstance!.cells[cellId];
                cell.placeables.forEach( pInstance => {
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
                });
            });
        });
    }

    private calculatePlayerProperties(id:string,include?:PropertyCalculationParams):Properties{
        const player = this.currentInstance!.players.find(player=>player.playerId == id);
        
        if(!player) throw new Error('Player not found');

        include = include || { cells:true,placeables:true,stockpiles:true,technologies:true};
        let props:Properties = {...player.properties};
        // Combinación con propiedades de celdas
        if(include.cells){
            player.cells.map( cellId => this.currentInstance!.cells[cellId] ).forEach( cellInstance =>{
                const cellProps = this.currentGame!.cells[cellInstance.cellId].properties;
                props = combineProperties(props,cellProps);
    
                cellInstance.placeables
                    .map( pInstance => this.currentGame!.placeables[pInstance.placeableId] )
                    .forEach( placeable => {
                        props = combineProperties(props,placeable.properties);
                    });
            });   
        }
        // Combinación con propiedades de almacenes/recursos
        if(include.stockpiles){
            player.stockpiles.forEach( sp => {
                const resource = this.currentGame!.resources[sp.resourceId];
                const resProps = {...resource.properties}
                // Las propiedades de los recursos son acumulativas con cada unidad
                for(const key in resProps){
                    resProps[key] = resProps[key] * sp.amount;
                }
                props = combineProperties(props,resProps);
            });
        }
        // Combinación con propiedades de tecnologías investigadas
        if(include.technologies){
            player.technologies.forEach( techId => {
                const technology = this.currentGame!.technologies[techId]!;
                props = combineProperties(props,technology.properties!);            
            })
        }

        return props;
    }
    private processQueue():void{
        const now = Date.now();
        const props = this.calculatePlayerProperties(this.currentInstancePlayer!.playerId);
        const queueNumProcesses = props[ConstantProperties.QueueNumProcesses]||0;
        
        let i = 0;
        let cummulativeTime = 0;
        
        
        while(i < this.activityQueue.length){
            const item = this.activityQueue[i];
            const activity = this.getActivity(item.type);
            
            if(item.elapsed>=activity.duration){
                const deleted = this.activityQueue.splice(i,1);
                // Gestionar el fin de actividad
                this.onActivityFinished(deleted[0]);
            }else{
                if(i < queueNumProcesses){
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
        // Descontamos el coste de la actividad de los almacenes
        this.removeResources(this.currentInstancePlayer!,item.investment);

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
        }else if(item.type == ActivityType.Attack){
            this.attackPlayer(item.target as AttackActivityTarget);
        }else if(item.type == ActivityType.Explore){
            this.exploreCell(item.target as ExplorationActivityTarget);
        }else if(item.type == ActivityType.Claim){
            this.claimCell(item.target as ClaimActivityTarget);
        }
    }

    private claimCell(target:ClaimActivityTarget){
        const cell = this.currentInstance!.cells[target.cellInstanceId];
        if(cell.playerId == null){
            // Palante
            cell.playerId = this.currentInstancePlayer!.playerId;
            this.raise<CellInstance>(GameEvents.CellInstanceUpdated,cell);
        }else{
            // Es posible que alguien se haya hecho con la celda antes que el jugador
            this.sendMessageToPlayer({
                srcPlayerId:null,
                dstPlayerId:this.currentInstancePlayer!.playerId,
                contentType:MessageContentType.Plain,
                subject:'La reclamación ha fallado',
                type:MessageType.Notification,
                id:this.nextUUID(),
                message:'La misión de reclamación de la celda ha fallado, otro jugador la ha ocupado antes de llegar.',
                sendAt:Date.now()
            })
        }
    }

    private exploreCell(target:ExplorationActivityTarget){
        const cell = this.currentInstance!.cells[target.cellInstanceId];
        this.currentInstancePlayer!.exploredCells?.push(target.cellInstanceId);
        this.raise<CellInstance>(GameEvents.CellInstanceUpdated,cell);
        
    }

    private dismantleBuilding(target:DismantlingActivityTarget){
        this.removePlaceableInstance(target.cellInstanceId,target.placeableInstanceId);
        this.sendMessageToPlayer({
            srcPlayerId:null,
            dstPlayerId:this.currentInstancePlayer!.playerId,
            subject:'Edificio desmantelado',
            type:MessageType.Notification,
            contentType:MessageContentType.Plain,
            sendAt:Date.now()
        });
    }

    private getPlayerPlaceables(player:InstancePlayer):PlaceableInstance[]{
        const cellInstances = player!.cells.map( id => this.currentInstance!.cells[id] );
        const placeables = cellInstances.map( cInstance => cInstance.placeables).flat();
        return placeables;
    }

    private attackPlayer(target:AttackActivityTarget){
        /**
         * A continuación se describe la resolución de un combate:
         * 1.- Se calculan las estadisticas de ambos jugadores
         * 2.- Se enfrenta el ataque con la defensa de ambos para determinar el resultado
         * 3.- Se evalua el impacto de la ofensiva en los edificios del defensor
         * 4.- Se evalua el impacto de la ofensiva en las celdas del defensor
         * 5.- Se evalua el impacto de la ofensiva en los almacenes del defensor
         * 6.- Se evalua el impacto de la defensa en el contingente de ataque
         * 7.- Se evalua el botín obtenido por el atacante en caso de éxito
         */

        const attacker = this.currentInstancePlayer!;
        // En el ataque no se tienen en cuenta las celdas, edificios ni almacenes del atacante.
        const attackerProps = this.calculatePlayerProperties(attacker.playerId,{cells:false,placeables:false,stockpiles:false,technologies:true});
        // Representación de combate del atacante
        const attackerCombatPlayer = new CombatPlayer(
            attacker,
            attackerProps,
            target.resources.map( res => new CombatUnit({
                id:res.resourceId,
                type:'resource',
                props:this.currentGame!.resources[res.resourceId].properties,
                amount:res.amount
            }))
        );

        const defender = this.currentInstance!.players.find( player => player.playerId == target.instancePlayerId)!;
        // Propiedades del defensor, se emplean todos los elementos del juego para darle ventaja.
        const defenderProps = this.calculatePlayerProperties(defender.playerId);
        /**
         * El contingente del defensor son todos los recursos hábiles para el combate.
         * Todos los edificios son objetivos de guerra
         */
        const defenderBuildingsById:Record<string,number> = {};
        // Calculamos la cantidad de edificios de cada tipo que tiene el defensor para armar los CombatUnit
        this.getPlayerPlaceables(defender).forEach(pInstance => {
            if(defenderBuildingsById[pInstance.placeableId] == undefined){
                defenderBuildingsById[pInstance.placeableId] = 1;
            }else{
                defenderBuildingsById[pInstance.placeableId]++;
            }
        });
        // Construimos la lista de emplazables con sus respectivas cantidades
        const defenderBuildings = Object
            .entries(defenderBuildingsById)
            .map( entry => ({
                amount:entry[1],
                id:entry[0],
                type:'placeable',
                props:this.currentGame!.placeables[entry[0]].properties
            } as CombatUnitInfo));
        // Obtenemos la lista de recursos aptos para la batalla
        const warlikeResources = defender.stockpiles
            .map( sp => ({
                id:sp.resourceId,
                type:'resource',
                props:this.currentGame!.resources[sp.resourceId].properties,
                amount:sp.amount
            } as CombatUnitInfo)).filter( res => {
                const hasAttack  = res.props[ConstantProperties.Attack] != undefined;
                const hasDefence  = res.props[ConstantProperties.Defence] != undefined;
                
                if(hasAttack || hasDefence) return res;
            });

        const defenderContingent = [...warlikeResources,...defenderBuildings];
        const defenderCombatPlayer = new CombatPlayer(defender,defenderProps,defenderContingent.map(unit=>new CombatUnit(unit)));
        // Ejecutar el ataque
        const report = attackerCombatPlayer.attack(defenderCombatPlayer);
        const reward:ResourceAmount[] =  [];

        if(report.result != CombatResult.Tie){
            // 1.- Eliminar recursos
            this.removeResources(defender,report.defenderDestroyedResources);
            // Recolectar todos los emplazables del jugador y las celdas donde se encuentran para borrarlos
            defender.cells
                .map( id => this.currentInstance!.cells[id].placeables.map( pi => ({
                    cellInstanceId:id,pInstanceId:pi.id
                })))
                .flat()
                .forEach( item => {
                    this.removePlaceableInstance(item.cellInstanceId,item.pInstanceId)
                });
            
            // 3.- Eliminar los recursos destruidos del atacante
            this.removeResources(attacker,report.attackerDestroyedResources);

            // 4.- Si el ganador es el atacante, darle su premio
            if(report.result == CombatResult.AttackerWin){                
                /** 
                 * Por cada tipo de unidad enviada se elige un almacen y se extrae
                 * tanto material como el recurso pueda transportar. El número de recursos
                 * a transportar depende del peso de cada uno. Cuantos mas tipos de recursos
                 * enviados, mayor diversidad de recursos se extraerán.
                 */
                for(let i = 0;i < report.attacker.units.length; i++){
                    const cUnit = report.attacker.units[i];
                    const stockpile = randomItem(defender.stockpiles);
                    const resource = this.currentGame!.resources[stockpile.resourceId];
                    const resWeight = resource.properties[ConstantProperties.Weight] || 1;
                    const toBeRemoved = Math.min(stockpile.amount,cUnit.capacity / resWeight);
                    reward.push({amount:toBeRemoved,resourceId:resource.id});
                }
                // Ajustamos cada almacen para reflejar el botin
                this.addResources(attacker,reward);
                this.removeResources(defender,reward);
            }
        }

        const summary = createCombatSummary(report,reward);
        
        this.sendMessageToPlayer({
            contentType:MessageContentType.AttackReport,
            srcPlayerId:null,
            dstPlayerId:attacker.playerId,
            subject:'Misión de ataque completada',
            type:MessageType.Report,
            id:this.nextUUID(),
            message:summary,
            sendAt:Date.now()
        });
        
        return summary;
    }
    
    private createSpyReport(target:SpyActivityTarget){
        const self = this.currentInstancePlayer;
        const opponent = this.currentInstance?.players.find(ip => ip.playerId == target.instancePlayerId);
        const selfProps = this.calculatePlayerProperties(self!.playerId);
        const opponentProps = this.calculatePlayerProperties(opponent!.playerId);

        const success = selfProps[ConstantProperties.SpySucceed] || 0;
        const fail = opponentProps[ConstantProperties.SpyAvoid] || 0;

        // Es una comprobación un poco naive, pero es mejor no complicarse innecesariamente
        let report:SpyReport;
        const opponentBuildingCount = opponent!.cells
            .map( id => this.currentInstance?.cells[id])
            .map(cInstance => cInstance?.placeables.length )
            .reduce( (prev,current) => (current||0)+(prev||0) , 0);

        if(success > fail){
            // Creamos el informe
            /**
             * Hay que tener cuidado con el ordem de eficiciencia de
             * determinados algoritmos, ya que aquí no hay posibilidad
             * de hacer multitarea y no se debe bloquear el hilo principal.
             * Por ejemplo, no es buena idea (en ningún caso) iterar a través
             * de todas las celdas de la instancia (500 x 500).
             * Ante la duda, delegar en el cliente para que lance una nueva
             * solicitud y se procese aparte.
             */
            report = {
                success:true,
                playerId:target.instancePlayerId,
                playerName:opponent!.media.name,
                cells:opponent!.cells.length,
                properties:opponentProps,
                buildings:opponentBuildingCount,
                technologies:opponent!.technologies,
                stockpiles:opponent!.stockpiles
            };
        }else{
            report = {
                success:false
            }
        }

        const notification:Message = {
            srcPlayerId:null,
            dstPlayerId:self!.playerId,
            subject:'Informe de espionaje a '+opponent!.media.name,
            type:MessageType.Report,
            contentType:MessageContentType.SpyReport,
            sendAt:Date.now(),
            id:this.nextUUID(),
            senderName:self!.media.name,
            message:report
        }

        this.sendMessageToPlayer(notification);
    }
    private onActivityCanceled(item:EnqueuedActivity):void{
        // Primero, devolver el coste de la actividad
        const stockPiles = toMap(this.getCurrentPlayer().stockpiles, sp => sp.resourceId);
        this.addResources(this.currentInstancePlayer!,item.investment);

        if(item.type == ActivityType.Build){
            const target = item.target as BuildingActivityTarget;
            this.removePlaceableInstance(target.cellInstanceId,target.placeableInstanceId!);
        }

        this.raise<EnqueuedActivity>(GameEvents.ActivityCanceled,item);
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
            this.raise(GameEvents.PlaceableFinished,placeableInstance);
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
                // Notificación de actualización de celda
                this.raise(GameEvents.CellInstanceUpdated,cellInstance);
                console.log('Se han eliminado los emplazables',deleted);
                break;
            }
        }
    }

    private sendMessageToPlayer(message:Message){
        // TODO En la API de servidor quitar el jugador local, 
        if(message.dstPlayerId == this.currentInstancePlayer!.playerId){
            this.playerMessages.push(message);
            this.raise(GameEvents.IncomingMessage,message);
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
            this.currentInstancePlayer = instance.players.find( player => player.playerId == this.currentPlayer!.id);
            this.currentGame = new GameData(game);
            this.internalGame = game;

            console.log("El jugador",this.currentInstancePlayer!.playerId,"ha entrado");
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
                    /**
                     * Las celdas visibles para el jugador serán:
                     * - Las de su propiedad
                     * - Las que se encuentren a un radio x de la celda principal
                     * El radio aumenta con la tecnología adecuada
                     * Solo se pueden explorar y reclamar celdas en el area de influencia
                     */
                    const player = this.currentInstancePlayer!;
                    const mainCell = this.currentInstance.cells[player.cells[0]];
                    const visibleCells:CellInstance[] = [];
                    const props = this.calculatePlayerProperties(player.playerId);
                    const radius = props[ConstantProperties.InfluenceRadius];
                    for(let y = mainCell.position.y-radius;y < mainCell.position.y+radius;y++){
                        for(let x = mainCell.position.x-radius;x < mainCell.position.x+radius;x++){
                            if(x >= 0 && y >= 0 && x < MAP_SIZE && y < MAP_SIZE){
                                if(new Vector(x,y).distance(mainCell.position) <= radius){
                                    const cell = this.currentInstance.cells[y*MAP_SIZE+x];
                                    if(cell.playerId == player.playerId){
                                        // Damos toda la info
                                        visibleCells.push(cell);
                                    }else{
                                        if(player.exploredCells?.some( cid => cid == cell.id)){
                                            // Esta celda ya había sido explorada, devolvemos todos los datos
                                            visibleCells.push(cell);
                                        }else{
                                            // Esta celda no se ha explorado, ocultamos terreno, props, etc
                                            visibleCells.push({
                                                position:cell.position,
                                                id:cell.id,
                                                cellId:this.internalGame!.config.unknownCellId,
                                                placeables:[],
                                                playerId:null
                                            })
                                        }
                                    }
                                }
                            }
                        }    
                    }
                    //resolve(this.currentInstance.cells.filter( cell => cell.playerId == this.currentInstancePlayer?.playerId))
                    resolve(visibleCells);
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
        console.log('Starting target',target)    
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
                this.onActivityCreated(item);
                
                resolve(item.id);
            }else{
                reject(availability);
            }
            
        });
    }

    changeActivityOrder(id: number, offset: number): Promise<void> {
        return new Promise( (resolve,reject)=>{
            const currentIndex = this.activityQueue.findIndex( ea => ea.id == id);
            const activity = this.activityQueue.find(ea => ea.id == id);
            const newIndex = currentIndex + offset;
            // Validaciones varias
            if(!activity) reject('No se ha encontrado la actividad solicitada');
            if(newIndex <= 0) reject('La posición de la actividad no es válida');
            if(this.activityQueue[newIndex].startedAt || activity?.startedAt) reject('No se puede alterar una actividad en marcha');

            const aux = this.activityQueue[newIndex]!;
            this.activityQueue[newIndex] = activity!;
            this.activityQueue[currentIndex] = aux;
            
            resolve();
        })
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

    private addResources(player:InstancePlayer, amounts:ResourceAmount[]):void{
        const stockpiles = player.stockpiles;
        const stockpileMap = toMap(stockpiles, sp=>sp.resourceId);
        amounts.forEach(item => {
            stockpileMap[item.resourceId].amount += item.amount;
        })
        
        // Solo en caso dle jugador local
        if(player == this.currentInstancePlayer!){
            this.raise<Stockpile[]>(GameEvents.StockpilesChanged,stockpiles);
        }
    }

    private removeResources(player:InstancePlayer, amounts:ResourceAmount[]):void{
        const stockpiles = player.stockpiles;
        const stockpileMap = toMap(stockpiles, sp=>sp.resourceId);
        amounts.forEach(item => {
            stockpileMap[item.resourceId].amount -= item.amount;
        })

        // Solo en caso dle jugador local
        if(player == this.currentInstancePlayer!){
            this.raise<Stockpile[]>(GameEvents.StockpilesChanged,stockpiles);
        }
        
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
                if(y >= 0 && x >= 0 && x < MAP_SIZE &&  y < MAP_SIZE){
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
                        cellId:cell.cellId,
                        playerId:cell.playerId||undefined
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
        const builtPlaceables = this.currentInstancePlayer.cells
            .map( cellId => this.currentInstance!.cells[cellId].placeables)
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
            const sender = this.currentInstance!.players.find( player => player.playerId == agreement.srcPlayerId)!;
            const receiver = this.currentInstance!.players.find( player => player.playerId == agreement.dstPlayerId)!;
            // Los recursos del tratado se bloquean hasta su aceptación o cancelación
            this.removeResources(sender,agreement.offer);

            // 1.- Añadir a la lista de tratos comerciales pendientes de aceptar en la instancia
            agreement.id = this.nextUUID();
            this.currentInstance?.pendingTradingAgreements.push(agreement);
            
            // 2.- Generar la notificación para el oponente
            // TODO Esto no está siquiera disponible en el cliente
            // 3.- Generar la notificación para el emisor
            this.sendMessageToPlayer({
                id:this.nextUUID(),
                dstPlayerId:agreement.dstPlayerId,
                srcPlayerId:sender.playerId,
                senderName:sender.media.name,
                type:MessageType.Notification,
                contentType:MessageContentType.TradeReport,
                subject:"Propuesta comercial",
                message:agreement,
                sendAt:Date.now()
            });

            /**
             * HASTA QUE NO ESTE TERMINADO EL SERVIDOR, GENERAMOS UN ACUERDO
             * INVERSO, IDENTICO PERO PROVINIENTE DEL OTRO JUGADOR, PARA TESTEAR
             * LA ACEPTACIÓN.
             */
            const inverseAgreement = {...agreement};
            inverseAgreement.id = this.nextUUID();
            inverseAgreement.srcPlayerId = agreement.dstPlayerId;
            inverseAgreement.dstPlayerId = agreement.srcPlayerId;

            this.currentInstance?.pendingTradingAgreements.push(inverseAgreement);
            console.log('fus')
            this.sendMessageToPlayer({
                 id:this.nextUUID(),
                 message:agreement,
                 dstPlayerId:this.currentInstancePlayer!.playerId,
                 type:MessageType.Notification,
                 subject:"Nuevo tratado comercial",
                 contentType:MessageContentType.TradeReport,
                 srcPlayerId:agreement.dstPlayerId,
                 senderName:this.currentInstance!.players.find( player => player.playerId == agreement.dstPlayerId)?.media.name,
                 sendAt:Date.now()
             });

            resolve( agreement.id );
        });
    }

    private deleteTradingAgreement(id:number){
        this.currentInstance!.pendingTradingAgreements = this.currentInstance!.pendingTradingAgreements.filter(
            item => item.id != id
        );
    }
    cancelTradeAgreement(id:number):Promise<void|string>{
        return new Promise( (resolve,reject) => {
            const agreement = this.currentInstance?.pendingTradingAgreements.find( ta => ta.id == id);
            const srcPlayer = this.currentInstance?.players.find( player => player.playerId == agreement?.srcPlayerId);
            const dstPlayer = this.currentInstance?.players.find( player => player.playerId == agreement?.dstPlayerId);
            const players = [agreement?.srcPlayerId,agreement?.dstPlayerId];
            const initiator = this.currentInstancePlayer!;
            
            /**
             * Un acuerdo comercial lo puede cancelar cualquiera de los jugadores
             * involucrados. Al cancelar el acuerdo comercial, el emisor recupera
             * los recursos invertidos.
             */            
            if(!agreement){
                reject('No se ha encontrado el tratado comercial');
            }else if(!srcPlayer || !dstPlayer){
                reject('No se ha encontrado a uno o varios de los participantes del acuerdo');
            }else if(players.indexOf(initiator.playerId) == -1){
                reject('El jugador no puede cancelar un pacto en el que no está involucrado');
            }else{
                // Se devuelven los recursos al jugador que inició el tratado
                // TODO Por ahora solo se dan los recursos si quien inicia
                // la cancelación es quien emite la solicitud, ya que addresources()
                // está vinculado con el jugador local.
                if(initiator.playerId == srcPlayer.playerId){
                    this.addResources(this.currentInstancePlayer!,agreement.offer);
                }
                // Se genera una notificación para el emisor indicando
                // que la oferta se ha cancelado y que recupera sus recursos
                this.sendMessageToPlayer({
                    contentType:MessageContentType.Plain,
                    srcPlayerId:null,
                    dstPlayerId:srcPlayer.playerId,
                    message:'El jugador '+initiator.media.name+' ha cancelado el acuerdo comercial, tus recursos han sido devueltos.',
                    subject:'Acuerdo comercial cancelado',
                    type:MessageType.Notification,
                    id:this.nextUUID(),
                    sendAt:Date.now()
                });
                // Se genera una notificación para el receptor indicando
                // que la oferta se ha cancelado.
                this.sendMessageToPlayer({
                    contentType:MessageContentType.Plain,
                    srcPlayerId:null,
                    dstPlayerId:dstPlayer.playerId,
                    message:'El acuerdo comercial con '+srcPlayer.media.name+' ha sido cancelado.',
                    subject:'Acuerdo comercial cancelado',
                    type:MessageType.Notification,
                    id:this.nextUUID(),
                    sendAt:Date.now()
                });

                // Finalmente, se borra el tratado de la lista de pendientes
                this.deleteTradingAgreement(id);
                resolve();
            }
        })
    }
    acceptTradeAgreement(id:number):Promise<void>{
        return new Promise( (resolve,reject) => {
            console.log('accept');
            /**
             * 1.- Descontar la solicitud al receptor
             * 2.- Sumar la solicitud al emisor
             * 3.- Sumar la oferta al receptor
             */
            // TODO Cuando hagas la parte de servidor tendrás que
            // añadir los recursos al emisor, aquí (cliente) no está
            // disponible ya que addResources() vincula con currentPlayer
            // Por ahora, solo se añade la solicitud al emisor
            const agreement = this.currentInstance?.pendingTradingAgreements.find( ta => ta.id == id);
            const srcPlayer = this.currentInstance!.players.find( player => player.playerId == agreement?.srcPlayerId)!;
            const dstPlayer = this.currentInstance!.players.find( player => player.playerId == agreement?.dstPlayerId);
            const players = [agreement?.srcPlayerId,agreement?.dstPlayerId];
            const self = this.currentInstancePlayer!;

            if(!agreement){ // existe el acuerdo?
                reject('No se ha encontrado el tratado comercial');
            }else if(self.playerId == dstPlayer?.playerId){ // El que acepta debe ser necesariamente dstPlayer
                // Se quitan al jugador que acepta los recursos requeridos
                this.removeResources(dstPlayer,agreement.request);
                // Se dan al jugador que acepta los recursos ofertados
                this.addResources(dstPlayer,agreement.offer);
                // Se dan al jugador que envía los recursos requeridos
                // sin quitarle nada, ya se le descontó la oferta al enviar.
                this.addResources(srcPlayer,agreement.request);

                // Finalmente, se borra el tratado de la lista de pendientes
                this.deleteTradingAgreement(id);
                // Notificar a ambos jugadores
                this.sendMessageToPlayer({
                    contentType:MessageContentType.Plain,
                    srcPlayerId:null,
                    dstPlayerId:dstPlayer.playerId,
                    message:'El acuerdo comercial con '+srcPlayer.media.name+' se ha completado con éxito',
                    subject:'Acuerdo comercial completado',
                    type:MessageType.Notification,
                    id:this.nextUUID(),
                    sendAt:Date.now()
                });

                resolve();
            }
        })
    }

    tradeAgreementActive(id:number):Promise<boolean>{
        return new Promise( (resolve,reject)=>{
            resolve(this.currentInstance!.pendingTradingAgreements.some( ta => ta.id == id));
        });
    }

    getMessages(text:string, type: MessageType, page: number): Promise<SearchResult<Message>> {
        console.log('Buscando mensajes de jugador',text,type,page)
        const offset = MESSAGES_PER_PAGE * (page-1); // aunque el cliente usa el rango [1,n], la api usa [0,n) o [0,n-1]
        const found = this.playerMessages.filter( msg => msg.type == type && msg.subject.indexOf(text) >= 0);
        const result:SearchResult<Message> = {
             count:found.length,
             page,
             pages: Math.ceil(found.length / MESSAGES_PER_PAGE),
             results: found.slice(offset,offset+MESSAGES_PER_PAGE).sort( (a,b)=> (b.sendAt||0) - (a.sendAt||0))
        }
        
        return new Promise( (resolve,reject) => {
            resolve(result);
        });
    }

    sendMessage(dstPlayerId:string,subject:string,message:string):Promise<Message>{
        if(!this.currentInstancePlayer) throw new Error('No se ha cargado la sesión del jugador');
        const msg:Message = {
            type:MessageType.Message,
            contentType:MessageContentType.Plain,
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
