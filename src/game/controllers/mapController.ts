import {Vector} from '@/game/classes/vector';
import { EventEmitter } from '../classes/events';
import { InputController, MotionEvents, MouseController, TouchController } from './input';
import { IGameAPI } from '../services/gameApi';

export abstract class MapController extends EventEmitter{
    private canvas:HTMLCanvasElement;
    private context:CanvasRenderingContext2D|null;
    private position:Vector = new Vector(0,0);
    private pan:Vector = new Vector(0,0);
    private zoom = 1;
    private redraw = true;
    private inputHandlers:InputController[] = [];
    private _api:IGameAPI;
    private _readyToPaint:boolean;
    constructor(canvas:HTMLCanvasElement,api:IGameAPI){
        super();
        this.canvas = canvas;
        this.context = this.canvas.getContext("2d");
        this._api = api;
        this._readyToPaint = false;
        this.inputHandlers = [
            new TouchController(this.canvas),
            new MouseController(this.canvas)
        ]
        // Configurar la entrada de ratón y pantalla táctil.
        // No hay problema en usar los mismos bindings para
        // ambos ya que no va a haber dos entradas en el mismo
        // dispositivo
        this.inputHandlers.forEach( handler => {
            handler.on(MotionEvents.SELECT,this.onSelect.bind(this));
            handler.on(MotionEvents.PANNING,this.panning.bind(this));
            handler.on(MotionEvents.PAN_START,this.panStart.bind(this));
            handler.on(MotionEvents.PAN_END,this.panEnd.bind(this));
        });

        this.paint();
    }
    get readyToPaint():boolean{ return this._readyToPaint;}
    set readyToPaint(value:boolean) { this._readyToPaint = value;}
    get api():IGameAPI {return this._api;}
    get width():number {return this.canvas.width;}
    get height():number {return this.canvas.height;}
    destroy(){
        super.destroy()
        this.inputHandlers.forEach( handler => handler.destroy());
    }
    protected centerTo(pos:Vector):void{
        this.position = new Vector(-pos.x + this.canvas.width/2,-pos.y+this.canvas.height/2);
        console.log(pos)
    }
    protected getPos(){
        return new Vector(this.position.x+this.pan.x,this.position.y+this.pan.y);
    }

    protected abstract onSelect(pos:Vector):void;
    protected abstract onPaint():void;

    private panStart(){
        console.log('pan start')    
    }
    private panEnd(){
        this.position.add(this.pan);
        this.pan.zero();
    }
    private panning(delta:Vector){
        this.pan = delta;
    }
   
    private clear(){
        this.context!.fillStyle = 'black';
        this.context!.fillRect(0,0,this.canvas.width,this.canvas.height);
    }

    protected getContext():CanvasRenderingContext2D{
        if(this.context != null){
            return this.context
        }else{
            throw new Error('Error al obtener el contexto del canvas (null)');
        }
    }
    private paint(){
        this.clear();
        
        if(this._readyToPaint){
            this.onPaint();
        }

        if(this.redraw){
            requestAnimationFrame(this.paint.bind(this));
        }
    }
}