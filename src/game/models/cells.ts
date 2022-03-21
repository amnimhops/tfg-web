import { Asset, AssetManager, ConstantAssets } from "./assets";
import { Info, InfoPanelActivity, InfoPanelTarget } from "./info";
import { Placeable, PlaceableInstance } from "./placeables";
import { Vector } from "./vector";

export class Cell extends Info{
    constructor(id:string,name:string,description:string,icon:Asset,image:Asset,private texture:Asset,private placeables:Placeable[]){
        super(id,name,description,icon,image);
    }

    getPlaceables():Placeable[]{
        return this.placeables;
    }
    getTexture():Asset{
        return this.texture;
    }
    getPath(){
        return `/world/cells/${this.getId()}`;
    }
}

export class CellInstance{
    constructor(private cell:Cell,private position:Vector,private placeables:PlaceableInstance[]){}
    getCell():Cell{
        return this.cell;
    }
    getPosition():Vector{
        return this.position;
    }
    getPlaceables():PlaceableInstance[]{
        return this.placeables;
    }
}

export class CellInstanceTarget implements InfoPanelTarget{
    constructor(private cell:CellInstance,private callback:(()=>void)){}
    get title(): string { return this.cell.getCell().getName()}
    get description(): string { return this.cell.getCell().getDescription()}
    get image(): string { return this.cell.getCell().getImage().getUrl()}
    get resourceFluxes(): string[] { return []}
    get path(): string[] { return []}
    get activities(): InfoPanelActivity[] { 
       return [
            {
                label:'Construir',
                icon:AssetManager.get(ConstantAssets.ICON_BUILD).getUrl(),
                callback:this.callback
            }
        ]
     }
}