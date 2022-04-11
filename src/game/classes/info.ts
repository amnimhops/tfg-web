import { useStore } from "@/store";
import { Cell, Resource, CellInstance, Media, ResourceFlow, Activity, ActivityType, Technology, FlowPeriodicity } from "shared/monolyth";
import { useGameAPI } from "../services/gameApi";
import { ResearchActivityTarget } from "./activities";
import { AssetManager, ConstantAssets } from "./assetManager";

export class InfoPanelActivity{
    constructor(public activity:Activity, public enabled:boolean=true, public causes:string[]=[]) {}
}
export class InfopanelTarget{
    media?:Media;
    path?:string[];
    flows?:ResourceFlow[];
    activities?:InfoPanelActivity[];
    
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
            new InfoPanelActivity(api.getActivity(ActivityType.Build))
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
        
    const targets:InfopanelTarget[] = [];
    // La instancia de la celda como primer elemento
    targets.push(new CellIPTarget(cellInstance,callback));
    
    // Los emplazables construidos a continuación
    
    for(const pid of cellInstance.placeableIds){
        targets.push(new ExistingPlaceableIPTarget(pid,callback));
    }
    
    console.log(targets.length,'targets')
    return targets;
}

export class TechIPTarget extends InfopanelTarget{
    constructor(public tech:Technology,callback:IPActionCallback){
        super(callback);
        const api = useGameAPI();
        const store = useStore();
        this.media = tech.media;
        this.activities = [];
        this.path = [];
        this.flows = []

        const availability = api.checkActivityAvailability(ActivityType.Research,new ResearchActivityTarget(tech));
        
        if(availability.available){
            this.activities.push(
                new InfoPanelActivity(
                    api.getActivity(ActivityType.Research),
                    availability.available,
                    availability.info
                )
            );
        }

        setInterval(()=>{
            this.activities?.forEach( ac => ac.enabled = !ac.enabled);
            store.commit('updatePanelSelectionTarget',this);
        },1000);
    }
}
