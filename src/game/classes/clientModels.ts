import { Game, GameInstance, Media, Placeable, Properties, Resource } from "shared/monolyth";
import { AssetManager } from "./assetManager";
/*
class GResource implements Resource{
    constructor(public id:string,public media:Media,public props?:Properties){}
}

class GPlaceable implements Placeable{
    constructor(public id:string, public type:string,public media:Media,public flows:GResourceFlow[],public texture:AssetManager,public props?:GProperties){

    }
}

class ClientGameModel{
    resources:Record<string,GResource>;
    placeables:Record<string,GPlaceable>;
    technologies:Record<string,GTechnology>;
    cells:Record<string,GCell>;
    instance:GInstance;
    players:Record<string,GPlayer>;
    
    constructor(gameData:Game,instance:GameInstance){
        this.resources = {};
        this.placeables = {};
        this.technologies = {};
        this.cells = {};
        
        this.buildDefs(gameData);
        this.players = {};
        //this.instance = 
    }
    buildDefs(gameData:Game){
        gameData.cells.forEach(cell => {
            const gCell = new GCell
        });     
    }
}*/