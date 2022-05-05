import { limit, randomInt, range } from "@/shared/functions";
import { Cell, Vector, WorldMapSector } from "@/shared/monolyth";
import { IGameAPI } from "../services/gameApi";
import { AbstractMapController } from "./canvasController";

function createFalseColorMap(map:Record<string,Cell>):Record<string,string>{
    const colorMap:Record<string,string> = {};
    const numCells = Object.keys(map).length;
    let index = 0;
    for(const key in map){
        colorMap[key] = '#'+range(3).map( () => randomInt(0xFF).toString(16).padStart(2,'0')).join('');
        index++
    }

    return colorMap;
}
export const WorldMapEvents = {
    PLAYERS_AVAILABLE : 'nearby_players',
    PLAYER_SELECTED : 'player:selected'
}

const SIZE = 25
export class WorldMapController extends AbstractMapController{
    private sector:WorldMapSector;
    private playerId:string;
    private colorMap:Record<string,string>;
    private api:IGameAPI;
    private pos:Vector;
    private mapPos:Vector;
    private pan:Vector;
    private zoomLevel:number;
    private mousePos:Vector;
    private paintFn:(()=>void)|null;
    constructor(canvas:HTMLCanvasElement, api:IGameAPI){
        super(canvas);
        this.api = api;
        this.pos = new Vector(0,0);
        this.mapPos = new Vector(0,0);
        this.mousePos = new Vector(0,0);
        this.pan = new Vector(0,0);
        this.zoomLevel = SIZE;
        this.colorMap = createFalseColorMap(this.api.getGameData().cells);
        this.playerId = api.getCurrentPlayer().playerId;
        this.sector = {
            height:0,
            width:0,
            map:[],
            players:[]
        }
        this.paintFn = this.paint.bind(this);
        this.recalculateMapSector();
        this.paint();
    }
    
    get cellW():number {
        // Asumiendo que el ancho es ligeramente más grande de lo que en 
        // realidad es, evitamos que aparezcan los huecos negros durante 
        // la transición de una sección del mapa a la siguiente
        return (this.width+this.size)/this.size;
    }
    get cellH():number {
        // Asumiendo que el alto es ligeramente más grande de lo que en 
        // realidad es, evitamos que aparezcan los huecos negros durante 
        // la transición de una sección del mapa a la siguiente
        return (this.height+this.size)/this.size;
    }
    get offsetX():number{
        return this.pos.x%this.cellW;
    }
    get offsetY():number{
        return this.pos.y%this.cellH;
    }
    get size():number{
        return this.zoomLevel;
    }
    private recalculateMapSector(){
        console.log('Buscando sección del mapa');
        this.api.getWorldMap({
            p1:this.mapPos.copy(),
            p2:this.mapPos.copy().add(new Vector(this.size,this.size))
        }).then( sector =>{
            this.sector = sector;
            console.log(this.sector)
            this.raise(WorldMapEvents.PLAYERS_AVAILABLE,this.sector.players);
        });
    }
    protected select(pos: Vector): void {
        const [ox,oy] = [this.offsetX,this.offsetY];
        const x = Math.floor((this.mousePos.x-ox)/this.cellW);
        const y = Math.floor((this.mousePos.y-oy)/this.cellH);
        console.log(x+this.mapPos.x,y+this.mapPos.y)
    }
    protected panStart(): void {
        console.log('pan start')
    }
    protected panning(delta: Vector): void {
        this.pan = delta;
    }
    protected panEnd(): void {
        this.pos.x += this.pan.x;
        this.pos.y += this.pan.y;
       
        // Transformamos de coordenadas-pantalla a coordenadas-mapa
        const mx = Math.floor(-this.pos.x/this.cellW);
        const my = Math.floor(-this.pos.y/this.cellH);
        
        this.mapPos = new Vector(mx,my);
        this.recalculateMapSector();
        
        console.log('pan',this.pan,'pos',this.pos,'delta','map',this.mapPos)
        this.pan.zero();
    }
    protected zoom(level: number): void {
        this.zoomLevel+=Math.floor(level/100);
        this.zoomLevel = limit(this.zoomLevel,10,200);
        console.log(this.zoomLevel)
        this.recalculateMapSector();
    }
    protected mouseMove(pos: Vector): void {
        const selfRect = this.canvas.getBoundingClientRect();
        this.mousePos = pos.sub(new Vector(selfRect.x,selfRect.y));
    }

    protected onSelect(pos: Vector): void {
        throw new Error("Method not implemented.");
    }

    private paintCursor(){
        const context = this.getContext();
        const [ox,oy] = [this.offsetX,this.offsetY];
        const x = Math.floor((this.mousePos.x-ox)/this.cellW)*this.cellW;
        const y = Math.floor((this.mousePos.y-oy)/this.cellH)*this.cellH;
        context.fillStyle = "green";
        context.beginPath();
        context.rect(x+ox,y+oy,this.cellW,this.cellH);
        context.fill();
    }
    destroy(): void {
        super.destroy();
        this.paintFn = null;
    }
    protected paint(): void {
        this.clear();
        const context = this.getContext();
        context.lineWidth = 1;
        context.strokeStyle='#0a0a0a';//this.colorMap[cell.cellId]
        context.fillStyle='#a0a0a0';
        const currentPlayer = this.api.getCurrentPlayer();

        for(let i = 0; i < this.sector.map.length; i++ ){
            const x = (i % this.size) * this.cellW +this.pan.x+this.pos.x%this.cellW;
            const y = Math.floor(i / this.size) * this.cellH +this.pos.y%this.cellH+this.pan.y
            
            const cell = this.sector.map[i];
            if(cell.playerId){
                if(cell.playerId == currentPlayer.playerId){
                    context.fillStyle='blue';
                }else{
                    context.fillStyle='#a0a0a0';
                }
                context.beginPath();
                context.fillRect(x,y,this.cellW,this.cellH);
                context.strokeRect(x,y,this.cellW,this.cellH);
               // 
                //context.fillStyle = 'black'
                //context.fillText(cell.position.x+","+cell.position.y+","+this.colorMap[cell.cellId],x,y+10)
            }else{
                context.strokeRect(x,y,this.cellW,this.cellH);
            }
        }
        
        this.paintCursor()
        if(this.paintFn) requestAnimationFrame(this.paintFn);    
    }
}