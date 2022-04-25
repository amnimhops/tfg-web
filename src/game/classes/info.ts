import { useStore } from "@/store";
import { randomMedia } from "shared/mocks";
import { CellInstance, Media, ResourceFlow, Activity, ActivityType, Technology, EnqueuedActivity, Asset, Cell, Resource, Player, InstancePlayer, Message, MessageType, PlaceableInstance } from "shared/monolyth";
import { IGameAPI, useGameAPI } from "../services/gameApi";
import { BuildingActivityTarget, ResearchActivityTarget } from "./activities";
import { AssetManager, ASSET_EMPTY, ConstantAssets } from "./assetManager";
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
    api:IGameAPI;
    gameData:GameData;
    constructor(public actionCallback:IPActionCallback){
        this.api = useGameAPI();
        this.gameData = this.api.getGameData();
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
    constructor(public cellInstance:CellInstance,public placeableInstance:PlaceableInstance,actionCallback:IPActionCallback){
        super(actionCallback);
        this.media = this.gameData.placeables[placeableInstance.placeableId].media;
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

export class InstancePlayerIPTarget extends InfopanelTarget{
    public static ACTION_MESSAGE = 'send_message';
    constructor(public player:Partial<InstancePlayer>, actionCallback:IPActionCallback){
        super(actionCallback);
        this.media = player.media;
    }
}

export class MessageIPTarget extends InfopanelTarget{
    public static ACTION_REPLY = 'reply';
    constructor(public message:Message,public remotePlayer:Partial<InstancePlayer>, actionCallback:IPActionCallback){
        super(actionCallback);
        /**
         * Al contrario que el resto de targets del panel, los mensajes
         * de jugadores no tienen información de medios propia. En su lugar
         * creamos una 'virtual' con los valores que se desean mostrar.
         */
        this.media = {
            name: message.type == MessageType.Message? 'Mensaje' : message.type == MessageType.Notification? 'Notificación' : 'Informe',
            icon:ASSET_EMPTY,
            thumbnail:ASSET_EMPTY,
            description:'',
            image:this.getImageAsset(message.type)
        }
    }
    private getImageAsset(type:MessageType):Asset{
        if(type == MessageType.Message){
            return AssetManager.get(ConstantAssets.MESSAGING_MESSAGE);
        }else if(type == MessageType.Notification){
            return AssetManager.get(ConstantAssets.MESSAGING_NOTIFICATION);
        }else{
            return AssetManager.get(ConstantAssets.MESSAGING_REPORT)
        }
    }
}