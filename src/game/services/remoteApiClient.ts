import { Asset, Game, CellInstance, InstancePlayer, ActivityType, ActivityTarget, MessageType, SearchResult, Message, TradingAgreement, EnqueuedActivity, WorldMapQuery, WorldMapSector, User, WithToken, RegistrationRequest, GameStats, SearchParams } from "server/monolyth";
import { ActivityAvailability } from "../classes/activities";

import { IRemoteGameAPI } from "./remoteApi";
import {Base64} from "js-base64";

export class RemoteApiClient implements IRemoteGameAPI{
    private apiToken?:string;
    

    constructor(private restUrl:string){}
    private remoteApiCall<Expected>(resource:string,data?:any,method='GET',remoteContentType:'text'|'json'='json'):Promise<Expected>{
        const Authorization = this.apiToken || '';
        
        const config:RequestInit = {
            body:data?JSON.stringify(data):undefined,
            method,
            mode:'cors',
            headers:{
                'Content-Type':'application/json',
                Authorization
            }
        }
        
        return fetch(this.restUrl+resource,config)
        .then( response => { 
            // Algunas respuestas pueden ser texto plano 
            if(response.ok){
                return remoteContentType == 'json' ? response.json() : response.text() 
            }else{
                return response.text().then( (errText) => {
                    throw new Error(errText);
                });
            }
        }).then( data => data as Expected);
    }
    authenticate(email: string, pass: string): Promise<WithToken<User>> {
        return this.remoteApiCall<WithToken<User>>('/sessions/login',{email:email,password:pass},'POST').then( authorizedUser => {
            this.apiToken = authorizedUser.token;
            return authorizedUser;
        });
    }
    
    register(request:RegistrationRequest):Promise<WithToken<User>>{
        return this.remoteApiCall<WithToken<User>>('/users/register',request,'POST').then( authorizedUser => {
            this.apiToken = authorizedUser.token;
            return authorizedUser;
        });
    }
    
    /**
     * Determina si los datos de un usuario son válidos de cara a registrarlo
     * @param user Datos del usuario
     * @returns Un diccionario con parse clave/valor con los nombres de los campos que presentan errores
     */
    validateUser(user:User):Promise<Record<string,string>>{
        return this.remoteApiCall<Record<string,string>>('/users/check',user,'POST');
    }
    setToken(token:string):void{
        this.apiToken = token;
    }
    joinGame(id: string): Promise<Asset[]> {
        return this.remoteApiCall<Asset[]>(`/games/${id}/join`,{},'POST');
    }
    getGameList(): Promise<Partial<Game>[]> {
        return this.remoteApiCall<Partial<Game>[]>('/gamelist');
    }
    getGame():Promise<Game>{
        return this.remoteApiCall<Game>(`/instance/gamedata`);
    }
    getCells(): Promise<CellInstance[]> {
        return this.remoteApiCall<CellInstance[]>('/instance/cells');
    }
    getInstancePlayer(id: string): Promise<Partial<InstancePlayer>> {
        return this.remoteApiCall<Partial<InstancePlayer>>(`/instance/players/${id}`);
    }
    /* En el servidor se define como Partial, aunque solo
     * por compatibilidad con el otro getInstancePlayer: el 
     * dato devuelto será un InstancePlayer completo, se puede
     * castear sin peligro´.
     */
    getSelfPlayer():Promise<InstancePlayer>{
        return this.remoteApiCall<InstancePlayer>(`/instance/players/self`);
    }
    getQueue(): Promise<EnqueuedActivity[]> {
        return this.remoteApiCall<EnqueuedActivity[]>('/instance/queue')
    }
    startActivity(type: ActivityType, target: ActivityTarget): Promise<EnqueuedActivity> {
        return this.remoteApiCall<EnqueuedActivity>('/instance/queue',{type,target},'POST');
    }
    cancelActivity(id: number): Promise<void> {
        return this.remoteApiCall<void>(`/instance/queue/${id}`,'','DELETE','text')
    }
    changeActivityOrder(id: number, index: number): Promise<void> {
        return this.remoteApiCall<void>(`/instance/queue/${id}`,{offset:index},'PATCH','text');
    }
    getWorldMap(query:WorldMapQuery):Promise<WorldMapSector>{
        const sector = [query.p1.x,query.p1.y,query.p2.x,query.p2.y].join(',');
        return this.remoteApiCall<WorldMapSector>('/instance/map?sector='+sector);
    }
    getMessages(text: string, type: MessageType, page: number): Promise<SearchResult<Message>> {
        return this.remoteApiCall<SearchResult<Message>>(`/instance/messages?text=${text}&type=${type}&page=${page}`);
    }
    sendTradeAgreement(agreement: TradingAgreement): Promise<string> {
        return this.remoteApiCall<string>('/instance/trades',agreement,'POST','text');
    }
    cancelTradeAgreement(id: number): Promise<void> {
        return this.remoteApiCall<void>(`/instance/trades/${id}`,'','DELETE','text')
    }
    async acceptTradeAgreement(id: number): Promise<void> {
        // Un poco de magia de cara a las capas superiores
        // para que sigan en su mundo feliz
        const trade = await this.getTradeAgreement(id);
        return await this.remoteApiCall<void>(`/instance/trades/${id}`,{accepted:true},'PATCH','text');
    }
    getTradeAgreement(id: number): Promise<TradingAgreement> {
        return this.remoteApiCall<TradingAgreement>(`/instance/trades/${id}`);
    }
    sendMessage(dstPlayerId: string, subject: string, message: string): Promise<Message> {
        return this.remoteApiCall('/instance/messages',{dstPlayerId,subject,message},'POST');
    }
    deleteMessage(id: number): Promise<void> {
        return this.remoteApiCall<void>(`/instance/messages/${id}`,'','DELETE','text')
    }

    gameStats(id:string):Promise<GameStats>{
        return this.remoteApiCall<GameStats>(`/games/${id}/stats`);
    }

    searchGames(params:SearchParams):Promise<SearchResult<Partial<Game>>>{
        // Si tienes problemas de codificacion en algún extremo recuerda el fix de
        // https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
        return this.remoteApiCall<SearchResult<Partial<Game>>>('/games?q='+Base64.encode(JSON.stringify(params)));
    }
}
