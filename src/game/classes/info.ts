import { CellInstance, Media, Technology, Asset, Resource, InstancePlayer, Message, MessageType, PlaceableInstance, Placeable, ActivityType, ActivityTarget, Activity } from "shared/monolyth";
import { IGameAPI, useGameAPI } from "../services/gameApi";
import { AssetManager, ASSET_EMPTY, ConstantAssets } from "./assetManager";
import { GameData } from "./gameIndex";

export interface IPBreacrumbLink{
    href:string;
    label:string
}

export interface IPActionCallback{
    ():void;
}

export class InfopanelTarget{
    type:string;
    media?:Media;
    path?:IPBreacrumbLink[];
    api:IGameAPI;
    gameData:GameData;
    constructor(type:string){
        this.type = type;
        this.api = useGameAPI();
        this.gameData = this.api.getGameData();
    }    
}

export const InfoPanelType = {
    CellPane:'cell',
    PlaceablePane:'placeable',
    PlaceableInstancePane:'placeableInstance',
    PickBuildingPane:'pickBuilding',
    TechnologyPane:'technology',
    ResourcePane:'resource',
    PlayerPane:'player',
    MessagePane:'message',
    ActivityPane:'activity',
    TradeOptionsPane:'trade'
};

export class CellIPTarget extends InfopanelTarget{
    constructor(public cellInstance:CellInstance){
        super(InfoPanelType.CellPane);
        this.media = this.gameData.cells[cellInstance.cellId].media;
    }
}

export class PlaceableIPTarget extends InfopanelTarget{
    constructor(public placeable:Placeable){
        super(InfoPanelType.PlaceablePane);
        this.media = placeable.media;
    }
}

export class ExistingPlaceableIPTarget extends InfopanelTarget{
    constructor(public cellInstance:CellInstance,public placeableInstance:PlaceableInstance){
        super(InfoPanelType.PlaceableInstancePane);
        this.media = this.gameData.placeables[placeableInstance.placeableId].media;
    }
}

export class PickBuildingIPTarget extends InfopanelTarget{
    placeables:Placeable[];
    constructor(public cellInstance:CellInstance){
        super(InfoPanelType.PickBuildingPane);
        // Usamos los medios de la celda, pero cambiamos el nombre para
        // adecuar el panel. Ojo, que hay que SOBREESCRIBIR SOLO EN ESTA
        // instancia de media, de ahí la deconstrucción del objeto
        this.media = {...this.gameData.cells[cellInstance.cellId].media};
        this.media.name = "Seleccionar estructura";
        this.placeables = this.gameData.cells[cellInstance.cellId].allowedPlaceableIds.map( pid => this.gameData.placeables[pid]);
    }
}

export class TechIPTarget extends InfopanelTarget{
    constructor(public tech:Technology){
        super(InfoPanelType.TechnologyPane);
        this.media = this.gameData.technologies[tech.id].media;
    }
}

export class ResourceIPTarget extends InfopanelTarget{
    constructor(public resource:Resource){
        super(InfoPanelType.ResourcePane);
        this.media = resource.media;
    }
}

export class InstancePlayerIPTarget extends InfopanelTarget{
    constructor(public player:Partial<InstancePlayer>){
        super(InfoPanelType.PlayerPane);
        this.media = player.media;
    }
}

export class MessageIPTarget extends InfopanelTarget{
    constructor(public message:Message,public remotePlayer:Partial<InstancePlayer>){
        super(InfoPanelType.MessagePane);
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

export class ActivityIPTarget extends InfopanelTarget{
    activity:Activity;
    constructor(public activityType:ActivityType,public target:ActivityTarget, public callback?:IPActionCallback){
        super(InfoPanelType.ActivityPane);
        this.activity = this.api.getActivity(activityType);
        this.media = this.activity.media;
    }
}

export class TradeIPTarget extends InfopanelTarget{
    constructor(public player:Partial<InstancePlayer>){
        super(InfoPanelType.TradeOptionsPane);
        this.media = player.media;
    }
}