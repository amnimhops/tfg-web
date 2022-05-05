import { Asset, Game, CellInstance, InstancePlayer, ActivityType, ActivityTarget, MessageType, SearchResult, Message, TradingAgreement, EnqueuedActivity, WorldMapQuery, WorldMapSector } from "@/shared/monolyth";
import { ActivityAvailability } from "../classes/activities";

import { IRemoteGameAPI } from "./remoteApi";

export class RemoteApiClient implements IRemoteGameAPI{
    private apiToken?:string;
    

    constructor(private url:string){}
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
        
        return fetch(this.url+resource,config)
        .then( response => { 
            // Algunas respuestas pueden ser texto plano 
            return remoteContentType == 'json' ? response.json() : response.text() 
        }).then( data => data as Expected);
    }
    authenticate(email: string, pass: string): Promise<string> {
        return this.remoteApiCall<string>('/sessions/login',{email:email,password:pass},'POST','text').then( (token) => {
            this.apiToken = token;
            return token;
        });
    }
    joinGame(id: string): Promise<Asset[]> {
        return this.remoteApiCall<Asset[]>(`/games/${id}/join`,{},'POST');
    }
    getGameList(): Promise<Partial<Game>[]> {
        return this.remoteApiCall<Partial<Game>[]>('/games');
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
        throw new Error("Method not implemented.");
    }
    acceptTradeAgreement(id: number): Promise<void> {
        throw new Error("Method not implemented.");
    }
    tradeAgreementActive(id: number): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    sendMessage(dstPlayerId: string, subject: string, message: string): Promise<Message> {
        return this.remoteApiCall('/instance/messages',{dstPlayerId,subject,message},'POST');
    }
    deleteMessage(id: number): Promise<void> {
        return this.remoteApiCall<void>(`/instance/messages/${id}`,'','DELETE','text')
    }
}
