import { EventEmitter } from '../classes/events';
import { InputController, MotionEvents, MouseController, MouseEvents, TouchController } from './input';
import { IGameAPI } from '../services/gameApi';
import { Vector } from 'shared/monolyth';

export abstract class MapController extends EventEmitter{
    private canvas:HTMLCanvasElement;
    private context:CanvasRenderingContext2D|null;
    private position:Vector = new Vector(0,0);
    private pan:Vector = new Vector(0,0);
    private minZoom = 0.1;
    private maxZoom = 10;
    private zoom = 1;
    private redraw = true;
    private inputHandlers:InputController[] = [];
    private _api:IGameAPI;
    private _readyToPaint:boolean;
    private mousePosition:Vector;
    background?:HTMLImageElement;
    constructor(canvas:HTMLCanvasElement,api:IGameAPI){
        super();
        this.canvas = canvas;
        this.context = this.canvas.getContext("2d");
        this._api = api;
        this._readyToPaint = false;
        this.mousePosition = new Vector(0,0);
        this.inputHandlers = [
            new TouchController(this.canvas),
            new MouseController(this.canvas)
        ]
        // Configurar la entrada de ratón y pantalla táctil.
        // No hay problema en usar los mismos bindings para
        // ambos ya que no va a haber dos entradas en el mismo
        // dispositivo
        this.inputHandlers.forEach( handler => {
            handler.on(MotionEvents.SELECT,this.select.bind(this));
            handler.on(MotionEvents.PANNING,this.panning.bind(this));
            handler.on(MotionEvents.PAN_START,this.panStart.bind(this));
            handler.on(MotionEvents.PAN_END,this.panEnd.bind(this));
            //handler.on(MotionEvents.ZOOM_START,this.panEnd.bind(this));
            //handler.on(MotionEvents.ZOOMING,this.panEnd.bind(this));
            handler.on(MotionEvents.ZOOM_END,this.zoomEnd.bind(this));
        });

        this.inputHandlers[1]/*MouseController*/.on(MouseEvents.MOUSE_MOVE,this.mouseMove.bind(this));

        this.paint();
    }
    setupZoom(min:number,max:number){
        this.minZoom = min;
        this.maxZoom = max;
    }
    protected getZoom():number{
        return this.zoom;
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
        this.position = new Vector(-pos.x+this.canvas.width/this.zoom/2,-pos.y+this.canvas.height/this.zoom/2);//new Vector(-pos.x + this.canvas.width/2,-pos.y+this.canvas.height/2);
    }
    protected getPos(){
        return new Vector(this.position.x+this.pan.x,this.position.y+this.pan.y);
    }

    /**
     * Este método se introduce como paso intermedio para que la 
     * clase derivada obtenga los vectores traducidos al espacio
     * del canvas
     * @param pos 
     */
    private select(pos:Vector){
        // TODO Explicar aquí por qué se emplea la matriz inversa de la de transformación
        const point = this.getMatrix().inverse().transformPoint(new DOMPoint(pos.x,pos.y));
        this.onSelect(new Vector(point.x,point.y));
    }
    private mouseMove(pos:Vector){
        this.mousePosition = pos;
    }
    protected abstract onSelect(pos:Vector):void;
    protected abstract onPaint():void;
    public getMousePos():Vector{
        return new Vector().add(this.mousePosition).multiply(1/this.zoom).sub(this.position);
    }
    private getMatrix():DOMMatrix{
        const mtx = new DOMMatrix();
        mtx.scaleSelf(this.zoom,this.zoom);
        mtx.translateSelf(this.position.x+this.pan.x,this.position.y+this.pan.y);
        //this.context!.setTransform(mtx);
        return mtx;
    }
    private zoomEnd(amount:number){
        this.zoom = this.zoom - amount * 0.001;
        this.zoom = Math.min(this.zoom,this.maxZoom);
        this.zoom = Math.max(this.zoom,this.minZoom);
        // TODO El zoom hace lo que le da la gana, hay que centrarlo en el raton!
    }
    private panStart(){
        console.log('pan start')    
    }
    private panEnd(){
        this.position.add(this.pan);
        this.pan.zero();
    }
    private panning(delta:Vector){
        this.pan = delta.multiply(1/this.zoom);//TODO El zoom afecta a la velocidad del raton al hacer panning
    }
   
    protected clear(){
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
        this.context!.setTransform(new DOMMatrix());
        if(!this.background){
            this.clear();
        }else{
            this.context!.drawImage(this.background,0,0,this.width,this.height);
        }
        const transformed = this.getMatrix();
        this.context!.setTransform(transformed);
        if(this._readyToPaint){
            this.onPaint();
        }
        //this.context!.setTransform(transformed.inverse());

        if(this.redraw){
            requestAnimationFrame(this.paint.bind(this));
        }
    }
}