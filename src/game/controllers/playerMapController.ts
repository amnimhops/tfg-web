import {Vector} from '../models/vector';
import { CellInstance } from '../models/cells';
import { EventEmitter } from './events';
import { InputController, MotionEvents, MouseController, TouchController } from './input';
import { AssetManager } from '../models/assets';

const CELL_WIDTH = 101;
const CELL_HEIGHT = 61;
const H_DISPLACEMENT = 70;
const V_DISPLACEMENT = 31;

class HexCell{
    cell:CellInstance;
    pos:Vector;
    drawPos:Vector = new Vector();
    texture:HTMLImageElement;

    constructor(cell:CellInstance){
        this.cell = cell;
        this.pos = cell.getPosition();
        this.texture = cell.getCell().getTexture().getData();
    }
}

export const PlayerMapEvents = {
    CELL_SELECTED : 'cell_selected'
};
/**
 * @fires PlayerMapEvents.CELL_SELECTED
 */
export class PlayerMapController extends EventEmitter{
    private canvas:HTMLCanvasElement;
    private context:CanvasRenderingContext2D|null;
    private position:Vector = new Vector(0,0);
    private pan:Vector = new Vector(0,0);
    private zoom = 1;
    private redraw = true;
    private inputHandlers:InputController[] = [];
    private cells:HexCell[]
    private selected:HexCell|null;

    constructor(canvas:HTMLCanvasElement, cells:CellInstance[]){
        super();
        this.canvas = canvas;
        this.cells = cells.map( cell => new HexCell(cell));
        this.selected = null;
        
        this.context = this.canvas.getContext("2d");
        // Configurar la entrada de ratón y pantalla táctil.
        // No hay problema en usar los mismos bindings para
        // ambos ya que no va a haber dos entradas en el mismo
        // dispositivo
        this.inputHandlers = [
            new TouchController(this.canvas),
            new MouseController(this.canvas)
        ]

        this.inputHandlers.forEach( handler => {
            handler.on(MotionEvents.SELECT,this.select.bind(this));
            handler.on(MotionEvents.PANNING,this.panning.bind(this));
            handler.on(MotionEvents.PAN_START,this.panStart.bind(this));
            handler.on(MotionEvents.PAN_END,this.panEnd.bind(this));
        })
        
        this.paint();

        console.warn('Atención! Este controlador accede directamente al estado maestro de vuex');
        console.warn('con la consiguiente sobrecarga de rendimiento. Antes o después hay que sacar')
        console.warn('de aquí esta información y pasar copias unproxificadas')
    }
    destroy(){
        super.destroy()
        this.inputHandlers.forEach( handler => handler.destroy());
    }
    private getPos(){
        return new Vector(this.position.x+this.pan.x,this.position.y+this.pan.y);
    }

    private select(pos:Vector){
        let minDistance = Number.MAX_SAFE_INTEGER; 
        pos.sub(new Vector(CELL_WIDTH/2,CELL_HEIGHT/2));

        for(let i = 0; i < this.cells.length; i++){
            const cell = this.cells[i];
            const distance = pos.distance(cell.drawPos);

            if(distance < minDistance){
                minDistance = distance;
                this.selected = cell;
            }
        }
        
        this.raise(PlayerMapEvents.CELL_SELECTED,this.selected!.cell);
    }
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
    private drawHexMap(){
        /**
         * @type {PlayerData}
         */
        const pos = this.getPos();
        this.context!.fillStyle = 'green';
        const [canvasW,canvasH] = [this.canvas.width,this.canvas.height];

        let [x,y] = [0,0]; 

        for(let i=0;i<this.cells.length;i++){
            const hex = this.cells[i];
            const vDisplace = hex.pos.x % 2 == 1 ? V_DISPLACEMENT : 0;
            
            hex.drawPos.x = pos.x + H_DISPLACEMENT * (hex.pos.x)
            /**
             * La coordenada 'y' de dibujo cambia ligeramente para permitir que los hexagonos
             * tengan sensación de altura. Para esto, a la coordenada normal de dibujado hay
             * que restar la diferencia entre la altura real de la imagen y la esperada
             */
            const heightDiff = hex.texture.height - CELL_HEIGHT
            hex.drawPos.y = pos.y + CELL_HEIGHT * (hex.pos.y) + vDisplace;
        
            x = hex.drawPos.x;
            y = hex.drawPos.y;

            if(x > -CELL_WIDTH && y > -CELL_HEIGHT && x < canvasW && y < canvasH){
                this.context!.drawImage(
                    hex.texture,
                    hex.drawPos.x,
                    hex.drawPos.y - heightDiff
                );
                // A continuación se pintan los emplazables
               /* cell.placeables.forEach( placeable => {
                    //this.context.drawImage(this.assets.get('struct-texture-shop1').data,100,100,101,);

                });*/
            }
        }
        if(this.selected){
            const texture = AssetManager.get('cell-highlight').getData();
            const heightDiff = texture.height - CELL_HEIGHT
            this.context!.drawImage(
                texture,
                this.selected.drawPos.x ,
                this.selected.drawPos.y - heightDiff 
            );
            //this.context.fillRect(this.selected.drawPos.x,this.selected.drawPos.y,CELL_WIDTH,CELL_HEIGHT);
        }

        
        
        
    }
    private clear(){
        this.context!.fillStyle = 'black';
        this.context!.fillRect(0,0,this.canvas.width,this.canvas.height);
    }
    private paint(){
        //const t = new Date().getTime();
        this.clear();
        this.drawHexMap();

        //console.log(new Date().getTime()-t);
        // Reprogramar el repintado solo si no se ha invocado la
        // destrucción del componente.
        if(this.redraw){
            requestAnimationFrame(this.paint.bind(this));
        }
    }
}