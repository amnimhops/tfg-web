import { Cell, Resource, CellInstance, Media, ResourceFlow, Activity, ActivityType } from "shared/monolyth";
import { useGameAPI } from "../services/gameApi";
import { AssetManager, ConstantAssets } from "./assetManager";

export class InfopanelTarget{
    media?:Media;
    path?:string[];
    flows?:ResourceFlow[];
    activities?:Activity[];
    
    constructor(public callback:IPActionCallback){

    }
}

export class CellIPTarget extends InfopanelTarget{
    constructor(public cellInstance:CellInstance,callback:IPActionCallback){
        super(callback);
        const api = useGameAPI();
        const cell = api.getCell(cellInstance.cellId);
        
        this.media = cell.media;
        this.activities = [
            api.getActivity(ActivityType.Build)
        ];
        this.path = [];
        this.flows = []
    }
}

export class ExistingPlaceableIPTarget extends InfopanelTarget{
    constructor(pid:string,callback:IPActionCallback){
        super(callback);
        const api = useGameAPI();
        const placeable = api.getPlaceable(pid);
        
        this.media = placeable.media;
        this.activities = [];
        this.path = [];
        this.flows = []
    }
}

export interface IPActionCallback{
    (activity:Activity,target:InfopanelTarget):void;
}
export function buildCellInstanceTarget(cellInstance:CellInstance,callback:IPActionCallback):InfopanelTarget[]{
    const api = useGameAPI();
    
    const targets:InfopanelTarget[] = [];
    // La instancia de la celda como primer elemento
    targets.push(new CellIPTarget(cellInstance,callback));
    
    // Los emplazables construidos a continuación
    
    for(const pid of cellInstance.placeableIds){console.log(cellInstance.placeableIds)
        targets.push(new ExistingPlaceableIPTarget(pid,callback));
    }
    
    console.log(targets.length,'targets')
    return targets;
}

