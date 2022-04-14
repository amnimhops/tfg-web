import { useStore } from "@/store";
import { randomMedia } from "shared/mocks";
import { CellInstance, Media, ResourceFlow, Activity, ActivityType, Technology, EnqueuedActivity, Asset, Cell, Resource } from "shared/monolyth";
import { IGameAPI, useGameAPI } from "../services/gameApi";
import { BuildingActivityTarget, ResearchActivityTarget } from "./activities";
import { AssetManager, ConstantAssets } from "./assetManager";
import { GameData } from "./gameIndex";

export interface IPBreacrumbLink{
    href:string;
    label:string
}
export interface IPActionCallback{
    (cmd:string,data?:any):void;
}

export class InfopanelTarget{
    media?:Media;
    path?:IPBreacrumbLink[];
    gameData:GameData;
    constructor(public actionCallback:IPActionCallback){
        this.gameData = useGameAPI().getGameData();
    }    
}

export class CellIPTarget extends InfopanelTarget{
    public static ACTION_BUILD = 'build';
    public static ACTION_EXPLORE = 'explore';
    public static ACTION_CLAIM = 'claim';
    constructor(public cellInstance:CellInstance,actionCallback:IPActionCallback){
        super(actionCallback);
        this.media = this.gameData.cells[cellInstance.cellId].media;
    }
}

export class ExistingPlaceableIPTarget extends InfopanelTarget{
    public static ACTION_DISMANTLE = 'dismantle';
    constructor(public cellInstance:CellInstance,public pid:string,actionCallback:IPActionCallback){
        super(actionCallback);
        this.media = this.gameData.placeables[pid].media;
    }
}

export class TechIPTarget extends InfopanelTarget{
    public static ACTION_RESEARCH = 'research';
    public static ACTION_NAVIGATE = 'navigate';
    constructor(public tech:Technology,actionCallback:IPActionCallback){
        super(actionCallback);
        this.media = this.gameData.technologies[tech.id].media;
    }
}

export class ResourceIPTarget extends InfopanelTarget{
    constructor(public resource:Resource,actionCallback:IPActionCallback){
        super(actionCallback);
        this.media = resource.media;
    }
}