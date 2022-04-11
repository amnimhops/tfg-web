import { CellInstance } from 'shared/monolyth';
import {Vector} from '@/game/classes/vector';
import { AssetManager, ConstantAssets } from '../classes/assetManager';
import { GameEvents, IGameAPI, useGameAPI } from '../services/gameApi';
import { MapController } from './canvasController';

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

export class PlayerMapController extends MapController{
    private cells:HexCell[]
    private selected:HexCell|null;
    
    constructor(canvas:HTMLCanvasElement,api:IGameAPI){
        super(canvas,api);
        this.cells = [];
        this.selected = null;
        this.api.getCells().then(this.onCellsReceived.bind(this));
    }

    /**
     * Callback invocado al recibir las celdas del servidor.
     * @param playerMap Objeto IPlayerMap que controla la gestión de cambios remotos
     */
    onCellsReceived(cells:CellInstance[]){
        console.log('Map controller connected to server');
        const gameData = this.api.getGameData();
        this.cells = cells.map( cell => new HexCell(cell));
        this.selected = null;
        
        /**
         * Se cachean las posiciones de dibujado, esto ayuda a detectar
         * la celda sobre la que se ubica el ratón y aligera el bucle
         * de redibujado
         */
        this.onPaint();
        
        for(const hex of this.cells) {
            const terrainTexture = this.getTerrainTexture(hex);
            const vDisplace = hex.pos.x % 2 == 1 ? V_DISPLACEMENT : 0;
            
            hex.drawPos.x = H_DISPLACEMENT * (hex.pos.x)
            /**
             * La coordenada 'y' de dibujo cambia ligeramente para permitir que los hexagonos
             * tengan sensación de altura. Para esto, a la coordenada normal de dibujado hay
             * que restar la diferencia entre la altura real de la imagen y la esperada
             */
            hex.drawPos.y = CELL_HEIGHT * (hex.pos.y) + vDisplace;
        }
       
        // Notifica a super() que estamos listos para pintar
        this.readyToPaint = true;
        
        this.api.on(GameEvents.CellInstanceUpdated,(ci:CellInstance)=>{
            this.cells.forEach( hexcell => {
                if(hexcell.cellInstance.id == ci.id){
                    hexcell.cellInstance = ci;
                }
            })
        });
    }

    protected onSelect(pos:Vector):void{
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
        if(this.selected) console.log("xxxx",this.selected.drawPos,this.getPos())
        this.raise(PlayerMapEvents.CELL_SELECTED,this.selected?.cellInstance);
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

    protected onPaint():void{
        const pos = this.getPos();
        const [canvasW,canvasH] = [this.width,this.height];

        //let [x,y] = [0,0]; 

        // Propiedades para pintar el texto
        const ctx = this.getContext();
        ctx.font = "20px Arial black";
        ctx.fill
        ctx.textAlign = "center";
        ctx.fillStyle = 'white';
        for(let i=0;i<this.cells.length;i++){
            const hex = this.cells[i];
            const terrainTexture = this.getTerrainTexture(hex);
            const buildingTexture = this.getBuildingTexture(hex);

            //const vDisplace = hex.pos.x % 2 == 1 ? V_DISPLACEMENT : 0;
            
            //hex.drawPos.x = pos.x + H_DISPLACEMENT * (hex.pos.x)
            /**
             * La coordenada 'y' de dibujo cambia ligeramente para permitir que los hexagonos
             * tengan sensación de altura. Para esto, a la coordenada normal de dibujado hay
             * que restar la diferencia entre la altura real de la imagen y la esperada
             */
            const terrainHeightDiff = terrainTexture.height - CELL_HEIGHT
            //hex.drawPos.y = pos.y + CELL_HEIGHT * (hex.pos.y) + vDisplace;
        
            // Coordenadas de dibujo en el espacio de la pantalla
            const [screenX, screenY] = [hex.drawPos.x+pos.x,hex.drawPos.y+pos.y];
            // Solo se pintan aquellas celdas que caigan dentro de la pantalla
            // Se tienen en cuenta las celdas offscreen de la última linea horizontal
            // para no perder el efecto de superposición, y de la primera linea vertical
            // para compensar el desplazamiento de los hexágonos.
            // Hay que tener en cuenta también el zoom a la hora de calcular los límites 
            // de la pantalla
            if(screenX >= (-CELL_WIDTH * this.getZoom()) && screenY >=0 && screenX < canvasW / this.getZoom() && screenY < (canvasH + terrainHeightDiff) / this.getZoom()){
            //if(pos.x > -CELL_WIDTH && pos.y > -CELL_HEIGHT && pos.x < canvasW && pos.y < canvasH){
                // Pintar el terreno
                ctx.drawImage(
                    terrainTexture,
                    hex.drawPos.x,
                    hex.drawPos.y - terrainHeightDiff
                );
                // A continuación se pintan los emplazables
                if(buildingTexture){
                    const buildingHeightDiff = buildingTexture.height - CELL_HEIGHT
                    ctx.drawImage(
                        buildingTexture,
                        hex.drawPos.x,
                        hex.drawPos.y - buildingHeightDiff
                    );
                }
                // Pintar el badge con el número de edificios
                if(hex.cellInstance.placeableIds.length  > 1){
                    ctx.fillText(hex.cellInstance.placeableIds.length+'',hex.drawPos.x+CELL_WIDTH/2,hex.drawPos.y + CELL_HEIGHT / 2);
                }
            }
        }
       
        if(this.selected){
            const texture = AssetManager.get(ConstantAssets.HEX_SELECTED).data;
            const heightDiff = texture.height - CELL_HEIGHT
            ctx.drawImage(
                texture,
                this.selected.drawPos.x ,
                this.selected.drawPos.y - heightDiff 
            );
        }

        
        
        
    }
}