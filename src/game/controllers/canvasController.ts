import { EventEmitter } from '../classes/events';
import { InputController, MotionEvents, MouseController, MouseEvents, TouchController } from './input';
import { IGameAPI } from '../services/gameApi';
import { Vector } from 'shared/monolyth';

export abstract class AbstractMapController extends EventEmitter{
    protected canvas:HTMLCanvasElement;
    protected context:CanvasRenderingContext2D|null;
    private inputHandlers:InputController[] = [];
    constructor(canvas:HTMLCanvasElement){
        super();
        this.canvas = canvas;
        this.context = this.canvas.getContext("2d");
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
            handler.on(MotionEvents.ZOOM_END,this.zoom.bind(this));
        });

        this.inputHandlers[1]/*MouseController*/.on(MouseEvents.MOUSE_MOVE,this.mouseMove.bind(this));
    }
    get width():number {return this.canvas.width;}
    get height():number {return this.canvas.height;}

    destroy(){
        super.destroy()
        this.inputHandlers.forEach( handler => handler.destroy());
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

    protected abstract select(pos:Vector):void;
    protected abstract paint():void;
    protected abstract panStart():void
    protected abstract panEnd():void
    protected abstract zoom(level:number):void
    protected abstract mouseMove(pos:Vector):void
    protected abstract panning(delta:Vector):void
}

export abstract class ManagedMapController extends AbstractMapController{
    private position:Vector = new Vector(0,0);
    private pan:Vector = new Vector(0,0);
    private minZoom = 0.1;
    private maxZoom = 10;
    private zoomLevel = 1;
    private redraw = true;
    private _api:IGameAPI;
    private _readyToPaint:boolean;
    private mousePosition:Vector;
    
    private paintFn:()=>void;
    background?:HTMLImageElement;
    constructor(canvas:HTMLCanvasElement,api:IGameAPI){
        super(canvas);
        this._api = api;
        this._readyToPaint = false;
        this.mousePosition = new Vector(0,0);

        this.paintFn = this.paint.bind(this);
        this.paintFn();
    }
    setupZoom(min:number,max:number){
        this.minZoom = min;
        this.maxZoom = max;
    }
    protected getZoom():number{
        return this.zoomLevel;
    }
    get readyToPaint():boolean{ return this._readyToPaint;}
    set readyToPaint(value:boolean) { this._readyToPaint = value;}
    get api():IGameAPI {return this._api;}

    destroy(){
        this.redraw = false; // Dejar de replanificar requestAnimationFrame
        super.destroy()
    }

    protected centerTo(pos:Vector):void{
        this.position = new Vector(
            -pos.x+this.canvas.width/this.zoomLevel/2,
            -pos.y+this.canvas.height/this.zoomLevel/2
        );
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
    protected select(pos:Vector){
        // TODO Explicar aquí por qué se emplea la matriz inversa de la de transformación
        const point = this.getMatrix().inverse().transformPoint(new DOMPoint(pos.x,pos.y));
        this.onSelect(new Vector(point.x,point.y));
    }
    protected mouseMove(pos:Vector){
        this.mousePosition = pos;
    }
    protected abstract onSelect(pos:Vector):void;
    protected abstract onPaint():void;
    public getMousePos():Vector{
        return new Vector().add(this.mousePosition).multiply(1/this.zoomLevel).sub(this.position);
    }
    private getMatrix():DOMMatrix{
        const mtx = new DOMMatrix();
        mtx.scaleSelf(this.zoomLevel,this.zoomLevel);
        mtx.translateSelf(this.position.x+this.pan.x,this.position.y+this.pan.y);
        //this.context!.setTransform(mtx);
        return mtx;
    }
    protected zoom(amount:number){
        this.zoomLevel = this.zoomLevel - amount * 0.001;
        this.zoomLevel = Math.min(this.zoomLevel,this.maxZoom);
        this.zoomLevel = Math.max(this.zoomLevel,this.minZoom);
    }
    protected panStart(){
        console.log('pan start')    
    }
    protected panEnd(){
        this.position.add(this.pan);
        this.pan.zero();
    }
    protected panning(delta:Vector){
        this.pan = delta.multiply(1/this.zoomLevel);//TODO El zoom afecta a la velocidad del raton al hacer panning
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
    protected paint(){
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
            requestAnimationFrame(this.paintFn);
        }
    }
}
