import { Asset, Game, CellInstance, InstancePlayer, ActivityType, ActivityTarget, MessageType, SearchResult, Message, TradingAgreement, EnqueuedActivity, WorldMapQuery, WorldMapSector, User, WithToken, RegistrationRequest, GameStats, SearchParams } from "server/monolyth";
import { ActivityAvailability } from "../classes/activities";

/**
 * Esta interfaz define las operaciones que se llevan a cabo
 * en el lado del servidor, serán implementadas por el cliente
 * de comunicaciones.
 */
export interface IRemoteGameAPI{
    authenticate(email:string,pass:string):Promise<WithToken<User>>;
    validateUser(user:User):Promise<Record<string,string>>;
    register(request:RegistrationRequest):Promise<WithToken<User>>;
    gameStats(id:string):Promise<GameStats>;
    setToken(token:string):void;
    joinGame(id:string):Promise<Asset[]>;
    getGameList():Promise<Partial<Game>[]>;
    getGame():Promise<Game>;
    getCells():Promise<CellInstance[]>;
    getInstancePlayer(id:string):Promise<Partial<InstancePlayer>>;
    getSelfPlayer():Promise<InstancePlayer>;
    getWorldMap(query:WorldMapQuery):Promise<WorldMapSector>;
    getQueue():Promise<EnqueuedActivity[]>;
    startActivity(type:ActivityType,target:ActivityTarget):Promise<EnqueuedActivity>;
    cancelActivity(id:number):Promise<void>;
    changeActivityOrder(id:number,index:number):Promise<void>;
    getMessages(text:string, type: MessageType, page: number): Promise<SearchResult<Message>>;
    sendTradeAgreement(agreement:TradingAgreement):Promise<string>;
    cancelTradeAgreement(id:number):Promise<void>;
    acceptTradeAgreement(id:number):Promise<void>;
    getTradeAgreement(id:number):Promise<TradingAgreement>;
    sendMessage(dstPlayerId:string,subject:string,message:string):Promise<Message>;
    deleteMessage(id:number):Promise<void>;
    searchGames(params:SearchParams):Promise<SearchResult<Partial<Game>>>;
}