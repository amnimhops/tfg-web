import { CellInstance, Media, Technology, Asset, Resource, InstancePlayer, Message, MessageType, PlaceableInstance, Placeable } from "shared/monolyth";
import { IGameAPI, useGameAPI } from "../services/gameApi";
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

export class CellIPTarget extends InfopanelTarget{
    constructor(public cellInstance:CellInstance){
        super('cell');
        this.media = this.gameData.cells[cellInstance.cellId].media;
    }
}

export class PlaceableIPTarget extends InfopanelTarget{
    constructor(public placeable:Placeable){
        super('placeable');
        this.media = placeable.media;
    }
}

export class ExistingPlaceableIPTarget extends InfopanelTarget{
    constructor(public cellInstance:CellInstance,public placeableInstance:PlaceableInstance){
        super('placeableInstance');
        this.media = this.gameData.placeables[placeableInstance.placeableId].media;
    }
}

export class PickBuildingIPTarget extends InfopanelTarget{
    placeables:Placeable[];
    constructor(public cellInstance:CellInstance){
        super('pickBuilding');
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
        super('technology');
        this.media = this.gameData.technologies[tech.id].media;
    }
}

export class ResourceIPTarget extends InfopanelTarget{
    constructor(public resource:Resource){
        super('resource');
        this.media = resource.media;
    }
}

export class InstancePlayerIPTarget extends InfopanelTarget{
    constructor(public player:Partial<InstancePlayer>){
        super('player');
        this.media = player.media;
    }
}

export class MessageIPTarget extends InfopanelTarget{
    constructor(public message:Message,public remotePlayer:Partial<InstancePlayer>){
        super('message');
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