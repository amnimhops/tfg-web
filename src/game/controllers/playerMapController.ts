import { Cell, CellInstance, EnqueuedActivity } from 'shared/monolyth';
import {Vector} from '@/game/classes/vector';
import { EventEmitter } from '../classes/events';
import { InputController, MotionEvents, MouseController, TouchController } from './input';
import { AssetManager, ConstantAssets } from '../classes/assetManager';
import { GameEvents, IGameAPI, useGameAPI } from '../services/gameApi';
import { faBlackboard } from '@fortawesome/free-solid-svg-icons';

const CELL_WIDTH = 101;
const CELL_HEIGHT = 61;
const H_DISPLACEMENT = 70;
const V_DISPLACEMENT = 31;

class HexCell{
    cellInstance:CellInstance;
    pos:Vector;
    drawPos:Vector = new Vector();
    constructor(cellInstance:CellInstance){
        this.cellInstance = cellInstance;
        this.pos = cellInstance.position;
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
    private api:IGameAPI;
    
    constructor(canvas:HTMLCanvasElement,api:IGameAPI){
        super();console.log(canvas);
        this.canvas = canvas;
        this.context = this.canvas.getContext("2d");
        this.cells = [];
        this.selected = null;
        this.api = api;

        this.api.getCells().then(this.onCellsReceived.bind(this));
    }

    /**
     * Callback invocado al recibir las celdas del servidor.
     * @param playerMap Objeto IPlayerMap que controla la gestión de cambios remotos
     */
    onCellsReceived(cells:CellInstance[]){
        console.log('Map controller connected to server');
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
        });

        const gameData = this.api.getGameData();
        this.cells = cells.map( cell => new HexCell(cell));
        this.selected = null;
        
        this.paint();

        this.centerTo(this.cells[0].drawPos);

        this.api.on(GameEvents.CellInstanceUpdated,(ci:CellInstance)=>{
            this.cells.forEach( hexcell => {
                if(hexcell.cellInstance.id == ci.id){
                    hexcell.cellInstance = ci;
                }
            })
        });

        console.warn('Atención! Este controlador accede directamente al estado maestro de vuex');
        console.warn('con la consiguiente sobrecarga de rendimiento. Antes o después hay que sacar')
        console.warn('de aquí esta información y pasar copias unproxificadas')
    }
    destroy(){
        super.destroy()
        this.inputHandlers.forEach( handler => handler.destroy());
    }
    private centerTo(pos:Vector):void{
        this.position = new Vector(-pos.x + this.canvas.width/2,-pos.y+this.canvas.height/2);
        console.log(pos)
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
        
        this.raise(PlayerMapEvents.CELL_SELECTED,this.selected?.cellInstance);
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
    private getTerrainTexture(cell:HexCell):HTMLImageElement{
        const cellDef = this.api.getCell(cell.cellInstance.cellId);
        return AssetManager.get(cellDef.texture.id).data;
    }
    private getBuildingTexture(cell:HexCell):HTMLImageElement|undefined{
        const cellDef = this.api.getCell(cell.cellInstance.cellId).media.image.data;
        const numBuildings = cell.cellInstance.placeableIds.length;
        
        if(numBuildings == 0){
            return;
        }else{
            // Usamos la textura del primer edificio que encontremos
            const placeableTextureId = this.api.getPlaceable(cell.cellInstance.placeableIds[0]).texture.id;
            return AssetManager.get(placeableTextureId).data;
        }
    }

    private drawHexMap(){
        const pos = this.getPos();
        const [canvasW,canvasH] = [this.canvas.width,this.canvas.height];

        let [x,y] = [0,0]; 

        // Propiedades para pintar el texto
        this.context!.font = "20px Arial black";
        this.context!.fill
        this.context!.textAlign = "center";
        this.context!.fillStyle = 'white';
        for(let i=0;i<this.cells.length;i++){
            const hex = this.cells[i];
            const terrainTexture = this.getTerrainTexture(hex);
            const buildingTexture = this.getBuildingTexture(hex);

            const vDisplace = hex.pos.x % 2 == 1 ? V_DISPLACEMENT : 0;
            
            hex.drawPos.x = pos.x + H_DISPLACEMENT * (hex.pos.x)
            /**
             * La coordenada 'y' de dibujo cambia ligeramente para permitir que los hexagonos
             * tengan sensación de altura. Para esto, a la coordenada normal de dibujado hay
             * que restar la diferencia entre la altura real de la imagen y la esperada
             */
            const terrainHeightDiff = terrainTexture.height - CELL_HEIGHT
            hex.drawPos.y = pos.y + CELL_HEIGHT * (hex.pos.y) + vDisplace;
        
            x = hex.drawPos.x;
            y = hex.drawPos.y;

            if(x > -CELL_WIDTH && y > -CELL_HEIGHT && x < canvasW && y < canvasH){
                this.context!.drawImage(
                    terrainTexture,
                    hex.drawPos.x,
                    hex.drawPos.y - terrainHeightDiff
                );
                // A continuación se pintan los emplazables
                if(buildingTexture){
                    const buildingHeightDiff = buildingTexture.height - CELL_HEIGHT
                    this.context!.drawImage(
                        buildingTexture,
                        hex.drawPos.x,
                        hex.drawPos.y - buildingHeightDiff
                    );
                }
                // Pintar el badge con el número de edificios
                if(hex.cellInstance.placeableIds.length  > 1){
                    this.context!.fillText(hex.cellInstance.placeableIds.length+'',hex.drawPos.x+CELL_WIDTH/2,hex.drawPos.y + CELL_HEIGHT / 2);
                }
            }
        }
        if(this.selected){
            const texture = AssetManager.get(ConstantAssets.HEX_SELECTED).data;
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