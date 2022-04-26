import { Technology, UIConfig, Vector } from 'shared/monolyth';
import { AssetManager, ConstantAssets } from '../classes/assetManager';
import { GameEvents, IGameAPI } from '../services/gameApi';
import { ManagedMapController } from './canvasController';
import { toMap } from 'shared/functions';

interface TechTreeNode{
    tech:Technology;
    parent?:TechTreeNode;
    children:TechTreeNode[]
}
function findHierarchy(root:TechTreeNode, nodes:Technology[]){
    const children = nodes.filter( node => node.parent == root.tech.id)
    root.children = children.map( tech => ({parent:root,tech,children:[]}));
    root.children.forEach( child => findHierarchy(child,nodes));
}
const ORB_RADIUS = 100;

function buildTechOrb(tech:TechTreeNode[],arcRange?:[number,number],parent:TechOrb|null=null,outerLevel=1):TechOrb[]{
    
    arcRange = arcRange || [0,2*Math.PI];
    const radians = (arcRange[1] - arcRange[0]);
    const radianDelta = radians / tech.length;
    
    const orbs = [];
    for(let i = 0; i < tech.length; i++){
        let angle = arcRange[0] + (i * radianDelta) + radianDelta /2;
        // Se normaliza el ángulo para permitir rangos de arco negativos
        angle = angle < 0 ? Math.PI*2 + angle%(Math.PI*2) :  angle%(Math.PI*2);

        const vector = new Vector(Math.cos( angle), Math.sin( angle));
        const newOrb = new TechOrb(tech[i].tech,outerLevel,vector.multiply(200*8*outerLevel),parent);
        orbs.push(newOrb);
        
        // TODO Arreglar la distribución de los orbes hijos, no estan centrados
        const newArcRange:[number,number] = [
            arcRange[0]+i*radians/tech[i].children.length,
            arcRange[0]+(i+1)*radians/tech[i].children.length,
        ]
        

        
        const children = buildTechOrb(tech[i].children,newArcRange,newOrb,outerLevel+1);
        newOrb.children = children;
        orbs.push(...children);
    }

    return orbs;
}

class TechOrb{
    parent:TechOrb|null;
    selected:boolean;
    researched:boolean;
    children:TechOrb[];

    constructor(public tech: Technology, public level: number, public pos: Vector, parent:TechOrb|null = null,children:TechOrb[] = []){
        this.selected = false;
        this.children = children;
        this.parent = parent;
        this.researched = false;
    }
}

export const TechTreeEvents = {
    TECH_SELECTED : 'tech_selected'
};


export class TechTreeController extends ManagedMapController{
    
    orbs:TechOrb[];
    uiConfig:UIConfig;
    constructor(canvas:HTMLCanvasElement,api:IGameAPI){
        super(canvas,api);
        const techs = api.getTechnologyList();
        const roots = techs.filter( tech => tech.parent == null).map( tech => ({children:[],tech} as TechTreeNode));
        roots.forEach( root => findHierarchy(root,techs));

        this.orbs = buildTechOrb(roots);
        // Se marcan los orbes correspondientes a tecnologías investigadas
        const researched = toMap(api.getResearchedTechnologies(), tech => tech.id);
        this.orbs.forEach( orb => {
            if(researched[orb.tech.id]) orb.researched = true
        });
        this.background = AssetManager.get(ConstantAssets.TECH_BACKGROUND).data;

        this.readyToPaint = true;
        this.uiConfig = api.getUIConfig();
        this.onPaint();

        this.api.on(GameEvents.TechnologyResearched, (techId:string)=>{
            this.orbs.forEach(orb => {
                if(orb.tech.id == techId) orb.researched = true;
            });
        });
        
    }

    protected onSelect(pos: Vector): void {
        let selection = null;
        for(const orb of this.orbs){
            if(orb.pos.distance(pos) <= ORB_RADIUS){
                selection = orb;
            }else{
                // Deseleccionar cualquier orbe previament seleccionado
                orb.selected = false;
            }
        }
        if(selection) {
            selection.selected = true;
            this.raise(TechTreeEvents.TECH_SELECTED,selection.tech);
        }
    }

    public setSelected(tech:Technology):void{
        let selected = null;
        for(const orb of this.orbs){
            orb.selected = false;
            if(orb.tech.id == tech.id){
                selected = orb;
            }
        }

        if(selected) {
            selected.selected = true;
            this.centerTo(selected.pos);//selected.pos.copy().multiply(-1));
            this.raise(TechTreeEvents.TECH_SELECTED,selected.tech);
        }
    }

    protected onPaint(): void {
        const ctx = this.getContext();
        const mousePos = this.getMousePos()
 
        ctx.strokeStyle = this.uiConfig.uiControlBorderColor;
        ctx.lineWidth = 5;
        
        
        for(const orb of this.orbs){
            // Pinta las lineas primero, los orbes las ocultarán,
            // Esto es más sencillo que calcular los ángulos que
            // forman los orbes entre sí.
            this.drawOrbRelations(orb);
        }
        ctx.save();
        for(const orb of this.orbs){
            const hover = orb.pos.distance(mousePos) < ORB_RADIUS;
            // Pinta el orbe con el color apropiado
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(orb.pos.x,orb.pos.y, ORB_RADIUS, 0,  2* Math.PI);
            if(orb.selected){
                ctx.fillStyle = this.uiConfig.uiControlBackgroundSecondary;
            }else if(hover){
                ctx.fillStyle = this.uiConfig.uiControlBackgroundPrimary;
            }else{
                if(orb.researched){
                    ctx.fillStyle = '#005eff';
                }else{
                    ctx.fillStyle = this.uiConfig.uiControlBackgroundColor;       
                }
            }
            ctx.fill();
            // Finalmente pinta la textura
            if(orb.parent != null && orb.parent.researched == false){
                ctx.globalAlpha = 0.2;
            }else{
                ctx.globalAlpha = 1;
            }
            ctx.drawImage(this.getTechTexture(orb),orb.pos.x-ORB_RADIUS/2,orb.pos.y-ORB_RADIUS/2,ORB_RADIUS,ORB_RADIUS);
            ctx.globalAlpha = 1;
        }
        ctx.restore();
    }

    private drawOrbRelations(orb:TechOrb){
        if(orb.parent){
            const ctx = this.getContext();
            ctx.beginPath();
            ctx.moveTo(orb.pos.x,orb.pos.y);
            ctx.lineTo(orb.parent.pos.x,orb.parent.pos.y);
            ctx.stroke();
        }
    }

    private getTechTexture(orb:TechOrb):HTMLImageElement{
        return AssetManager.get(orb.tech.texture.id).data;
    }
}