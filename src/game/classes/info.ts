import { useStore } from "@/store";
import { activities } from "shared/mocks";
import { Cell, Resource, CellInstance, Media, ResourceFlow, Activity, ActivityType, Technology, FlowPeriodicity, EnqueuedActivity, Asset } from "shared/monolyth";
import { onUpdated } from "vue";
import { showInfoPanel } from "../controllers/ui";
import { IGameAPI, useGameAPI } from "../services/gameApi";
import { BuildingActivityTarget, ResearchActivityTarget } from "./activities";
import { AssetManager, ConstantAssets } from "./assetManager";

export const WorldAtlas = {
    mapa:{
        celdas:{

        },
        emplazables:{

        }
    },
    tecnologías:{

    },
    recursos:{

    },
    actividades:{

    }
}

export class InfoPanelActivity{
    constructor(public activity:Activity, public enabled:boolean=true, public causes:string[]=[]) {
        
    }
}
export class InfoPanelRunningActivity{
    
    constructor(public activity:EnqueuedActivity, public media:Media) {

    }
}
export interface IPBreacrumbLink{
    href:string;
    label:string
}
export interface IPActionCallback{
    (activity:Activity,target:InfopanelTarget):void;
}
export interface InfoPanelWarning{
    icon:Asset;
    label:string;
}
export abstract class InfopanelTarget{
    api:IGameAPI;
    media?:Media;
    path?:IPBreacrumbLink[];
    flows?:ResourceFlow[];
    warnings: InfoPanelWarning[] = [];

    constructor(public callback:IPActionCallback){
        this.api = useGameAPI();
    }    

    abstract getAvailableActivities():InfoPanelActivity[];
    abstract getRunningActivities():InfoPanelRunningActivity[];
}

export class CellIPTarget extends InfopanelTarget{
    constructor(public cellInstance:CellInstance,callback:IPActionCallback){
        super(callback);

        const cell = this.api.getCell(cellInstance.cellId);
        
        this.media = cell.media;
        this.path = [
            {href:'mapa',label:'mapa'},
            {href:'celdas',label:'celdas'},
            {href:cell.id,label:cell.media.name}
        ];
        this.flows = this.api.getActivity(ActivityType.Build).flows;
    }

    getAvailableActivities():InfoPanelActivity[]{
        return [new InfoPanelActivity(this.api.getActivity(ActivityType.Build))];
    }

    getRunningActivities(): InfoPanelRunningActivity[] {
        const involvedActivities = this.api.getQueue().filter( ea => ea.target instanceof BuildingActivityTarget && ea.target.cellInstanceId == this.cellInstance.id);
        const placeables = this.api.getGameData().placeables;
        return involvedActivities.map( activity => ({activity,media:placeables[(activity.target as BuildingActivityTarget).placeableId].media}));
    }
}

export class ExistingPlaceableIPTarget extends InfopanelTarget{
    constructor(public cellInstance:CellInstance,public pid:string,callback:IPActionCallback){
        super(callback);
        const placeable = this.api.getPlaceable(pid);
        
        this.media = placeable.media;
        this.path = [
            {href:'mapa',label:'mapa'},
            {href:'edificios',label:'edificios'},
            {href:placeable.id,label:placeable.media.name}
        ];
        this.flows = this.api.getActivity(ActivityType.Build).flows;
    }
    getAvailableActivities():InfoPanelActivity[]{
        return [new InfoPanelActivity(this.api.getActivity(ActivityType.Dismantle))];
    }
    getRunningActivities(): InfoPanelRunningActivity[] {
        const involvedActivities = this.api.getQueue().filter( ea => 
            ea.target instanceof BuildingActivityTarget && 
            ea.target.cellInstanceId == this.cellInstance.id &&
            ea.target.placeableId == this.pid
        );

        const placeables = this.api.getGameData().placeables;
        return involvedActivities.map( activity => ({activity,media:placeables[(activity.target as BuildingActivityTarget).placeableId].media}));
    }
}


export function buildCellInstanceTarget(cellInstance:CellInstance,callback:IPActionCallback):InfopanelTarget[]{
        
    const targets:InfopanelTarget[] = [];
    // La instancia de la celda como primer elemento
    targets.push(new CellIPTarget(cellInstance,callback));
    
    // Los emplazables construidos a continuación
    
    for(const pid of cellInstance.placeableIds){
        targets.push(new ExistingPlaceableIPTarget(cellInstance,pid,callback));
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
        this.path = [];
        this.flows = []
    }

    getAvailableActivities(): InfoPanelActivity[] {
        const availability = this.api.checkActivityAvailability(ActivityType.Research,new ResearchActivityTarget(this.tech));
        const activities = [];
        console.log('fu')
        if(availability.available){
            activities.push(
                new InfoPanelActivity(
                    this.api.getActivity(ActivityType.Research),
                    availability.available,
                    availability.info
                )
            );
        }else{
            this.warnings.push(...availability.info.map( reason => ({
                icon:AssetManager.get(ConstantAssets.UI_WARNING),label:reason
            })))
        }

        return activities;
    }

    getRunningActivities(): InfoPanelRunningActivity[] {
        const involvedActivities = this.api.getQueue().filter( ea => 
            ea.target instanceof ResearchActivityTarget && 
            ea.target.tech.id == this.tech.id
        );
        console.log(involvedActivities,'en tech!');
        return involvedActivities.map( ea => ({
            activity:ea,media:this.tech.media
        }));
    }
}
