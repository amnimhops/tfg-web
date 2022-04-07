import { CellInstance } from 'shared/monolyth';
import {Vector} from '@/game/classes/vector';
import { AssetManager, ConstantAssets } from '../classes/assetManager';
import { GameEvents, IGameAPI, useGameAPI } from '../services/gameApi';
import { MapController } from './mapController';

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
         * Se efectua una primera invocación a onPaint() porque internamente
         * se cachean las posiciones de dibujado. Su invocación no tiene mayor
         * efecto. Si no se hace, al llamar a centerTo(...) lo hará con una posición
         * incorrecta!
         */
        this.onPaint();
        this.centerTo(this.cells[0].drawPos);

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
        console.log(pos);
        const [canvasW,canvasH] = [this.width,this.height];

        let [x,y] = [0,0]; 

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