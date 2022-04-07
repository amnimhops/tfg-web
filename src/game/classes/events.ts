export interface IEventEmitter{
    on<T>(event:string,callback:(data:T)=>void):void;
}

export class EventEmitter implements IEventEmitter{
    private listeners:Record<string,(data:any)=>void> = {};

    constructor(){
        this.listeners = {};
    }
    destroy(){
        for(const key in this.listeners){
            delete this.listeners[key];
        }
    }

    on<T>(event:string,callback:(data:T)=>void):void{
        this.listeners[event] = callback;
    }
    raise<T>(event:string,data?:T){
        if(this.listeners[event] !== undefined){
            this.listeners[event](data);
        }else{
            throw new Error(`${event} is not listened`);
        }
    }
}