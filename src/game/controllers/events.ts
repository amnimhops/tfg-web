export class EventEmitter{
    private listeners:Record<string,(data:any)=>void> = {};

    constructor(){
        this.listeners = {};
    }
    destroy(){
        for(const key in this.listeners){
            delete this.listeners[key];
        }
    }

    on(event:string,callback:(data:any)=>void){
        this.listeners[event] = callback;
    }
    raise(event:string,data?:any){
        if(this.listeners[event] !== undefined){
            this.listeners[event](data);
        }else{
            throw new Error(`${event} is not listened`);
        }
    }
}