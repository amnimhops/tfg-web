import {Vector} from '@/shared/monolyth'
import { EventEmitter } from '../classes/events';

const STATE_NONE = 'none';
const STATE_PANNING = 'panning';
const STATE_ZOOMING = 'zooming';

export class InputController extends EventEmitter{
    private currentState?:string;
    private eventBindings:Record<string,(event:Event)=>void> = {};
    private canvas:HTMLCanvasElement;
    constructor(element:HTMLCanvasElement){
        super();
        this.canvas = element;
    }
    destroy(): void {
        super.destroy();
        for(const key in this.eventBindings){
            this.canvas.removeEventListener(key,this.eventBindings[key]);
            console.log('Removing canvas listener for',key);
        }
    }
    protected setCurrentState(state:string){
        this.currentState = state;
    }
    getCurrentState(){
        return this.currentState;
    }
    protected addEventBinding(event:string,binding:(event:Event)=>void){
        this.eventBindings[event] = binding;
        this.canvas.addEventListener(event,binding);
    }
    defaultHandler(){
        console.error("Error, no se ha definido un manejador para este evento")
    }
}

function getTouchDelta(prevTouch:Touch,nextTouch:Touch):Vector{
    return new Vector(
        nextTouch.pageX - prevTouch.pageX,
        nextTouch.pageY - prevTouch.pageY
    );
}

function deltaBelowThreshold(delta:Vector):boolean{
    return Math.abs(delta.x) <= TOUCH_THRESHOLD && Math.abs(delta.y) <= TOUCH_THRESHOLD
}

/**
 * Umbral por debajo del cual el controlador
 * asume que la acción es de selección
 */
const TOUCH_THRESHOLD = 5;
export const MotionEvents = {
    SELECT : 'select',
    PAN_START : 'pan_start',
    PANNING : 'panning',
    PAN_END : 'pan_end',
    ZOOM_START : 'zoom_start',
    ZOOMING : 'zooming',
    ZOOM_END : 'zoom_end'
}

export class TouchController extends InputController{
    private touches:Touch[];
    
    constructor(element:HTMLCanvasElement) {
        super(element);
        this.addEventBinding('touchstart',this.touchStart.bind(this));
        this.addEventBinding('touchmove',this.touchMove.bind(this));
        this.addEventBinding('touchend',this.touchEnd.bind(this));
        
        this.touches = [];
        this.setCurrentState(STATE_NONE);
    }

    private getTouchById(id:number):Touch {
        for (let i = 0; i < this.touches.length; i++) {
            if (id == this.touches[i].identifier) {
                return this.touches[i];
            }
        }
        throw new Error(`Touch with id ${id} not found`);
    }

    private touchStart(event:Event):void {
        console.log(event);
        event.preventDefault();
        const touches = (event as TouchEvent).changedTouches;

        for (let i = 0; i < touches.length; i++) {
            this.touches.push(touches[i]);
        }
    }
    private startPanning(pos:Vector){
        this.setCurrentState(STATE_PANNING);
        this.raise(MotionEvents.PAN_START,pos);
    }
    private endPanning(){
        this.setCurrentState(STATE_NONE);
        this.raise(MotionEvents.PAN_END);
    }
    private handlePanningState(prev:Touch,current:Touch){
        const delta = getTouchDelta(prev,current);
        
        if(!deltaBelowThreshold(delta)){
            switch(this.getCurrentState()){
                case STATE_NONE:
                    this.startPanning(new Vector(current.pageX,current.pageY));
                    break;
                case STATE_PANNING:
                    this.raise(MotionEvents.PANNING,delta);
                    break;
            }
        }
    }
    private touchMove(event:Event) {
        /**
         * Si hubiera un único toque en curso hacemos pan,
         * de lo contrario hacemos zoom
         */
        if(this.touches.length == 1){
            const current:Touch = (event as TouchEvent).touches[0];
            const prev:Touch = this.getTouchById(current.identifier);
            
            // Si está por debajo del umbral no hacemos nada
            // ya que puede ser un amago de clic
            this.handlePanningState(prev,current);
        }else{
            // TODO
            console.log('zoom?');
        }
        //console.log(this.touches.length)
    }
    private touchEnd(event:Event) {
        event.preventDefault();
        const touches = (event as TouchEvent).changedTouches;

        if(this.getCurrentState() == STATE_PANNING){
            this.endPanning();
        }else if(this.getCurrentState() == STATE_ZOOMING){
            // lo propio
        }else if(this.getCurrentState() == STATE_NONE){
            /**
             * Si no hay estado es un suelte sin movimiento previo
             * En este caso habrá que hacer un evento select, sin 
             * embargo puede haber pulsado varias veces. Así pues,
             * solo invocamos el evento si es el último touch
             */
            if(this.touches.length == 1){
                this.raise(MotionEvents.SELECT,new Vector(this.touches[0].pageX,this.touches[0].pageY));
            }else{
                console.warn("Se ha terminado un toque, pero no es el último. Se posterga el select()");
            }
        }
        // Si el número de toques registrados
        for (let i = 0; i < touches.length; i++) {
            this.touches.splice(i, 1);
        }
    }
}

export const MouseEvents = {
    MOUSE_MOVE : 'mouse_move'
}

export class MouseController extends InputController{
    private dragStart:Vector|null;
    private mousedown:boolean;

    constructor(element:HTMLCanvasElement){
        super(element);
        this.addEventBinding('mousedown',this.onPress.bind(this));
        this.addEventBinding('mouseup',this.onRelease.bind(this));
        this.addEventBinding('mousemove',this.onMove.bind(this));
        this.addEventBinding('wheel',this.onWheel.bind(this));
        
        this.dragStart = null;
        this.mousedown = false;
    }

    private onPress(){
        this.setCurrentState(STATE_NONE);
        this.mousedown = true;
        this.dragStart = null;
    }

    private onWheel(event:WheelEvent|Event){
        console.log(event);
        this.raise(MotionEvents.ZOOM_END,(event as WheelEvent).deltaY);
    }

    private onRelease(event:Event){
        const mouseEvent = event as MouseEvent;
        const state = this.getCurrentState();
        if(state == STATE_PANNING){
            this.raise(MotionEvents.PAN_END);
        }else if(state == STATE_ZOOMING){
            // lo propio
        }else if(state == STATE_NONE){
            this.raise(MotionEvents.SELECT,new Vector(mouseEvent.clientX,mouseEvent.clientY));
        }

        this.mousedown = false;
        this.setCurrentState(STATE_NONE);
    }
    private onMove(event:Event){
        const mouseEvent = event as MouseEvent;
        if(this.mousedown){
            if(this.dragStart == null){
                this.dragStart = new Vector(mouseEvent.clientX,mouseEvent.clientY);
                this.setCurrentState(STATE_PANNING);
                this.raise(MotionEvents.PAN_START,this.dragStart);
            }else{
                const pos = new Vector(mouseEvent.clientX,mouseEvent.clientY).sub(this.dragStart);
                //console.log(pos);
                this.raise(MotionEvents.PANNING,pos)
            }
        }else{
            this.raise(MouseEvents.MOUSE_MOVE,new Vector(mouseEvent.clientX,mouseEvent.clientY));
        }
    }
}