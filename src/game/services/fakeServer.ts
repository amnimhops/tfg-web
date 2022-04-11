import { Asset, Game, GameInstance, Media, Player, Technology, Vector } from "shared/monolyth";
import {players, games, gameInstances, randomName, MAP_SIZE} from "shared/mocks/";
import { randomInt, randomItem, range } from "shared/functions";
import { ConstantAssets } from "../classes/assetManager";
import { CellIPTarget } from "../classes/info";


const hexSelected = require("@/assets/resources/hex-selected.png");
const hexUnknwon = require("@/assets/resources/hex-unknown.png");

const ui_ok = require("@/assets/ui/icon-accept.svg");
const ui_cancel = require("@/assets/ui/icon-close.svg");

const water1 = require("@/assets/resources/water-1.png");
const dirt1 = require("@/assets/resources/dirt-1.png");
const dirt2 = require("@/assets/resources/dirt-2.png");
const forest1 = require("@/assets/resources/forest-1.png");
const forest2 = require("@/assets/resources/forest-2.png");    
const swamp1 = require("@/assets/images/swamp1.jpeg");
const swamp2 = require("@/assets/images/swamp2.jpg");
const beach = require("@/assets/images/beach.jpeg");
const iconbuilding = require("@/assets/resources/icon-building.svg");
const iconbuild = require("@/assets/resources/icon-build.svg");
const iconcell = require("@/assets/resources/icon-cell.svg");
const texturestructureshop1 = require("@/assets/resources/texture-structure-shop1.svg");
const structure1 = require("@/assets/images/structure-1.jpeg");
const structure2 = require("@/assets/images/structure-2.jpeg");
const structure3 = require("@/assets/images/structure-3.jpeg");
const structure4 = require("@/assets/images/structure-4.jpeg");
const structure5 = require("@/assets/images/structure-5.jpeg");
const btex1 = require("@/assets/resources/building-1.png");
const iconenergy = require("@/assets/resources/icon-energy.svg");
const iconsilver = require("@/assets/resources/icon-silver.svg");
const iconore = require("@/assets/resources/icon-ore.svg");
const icondiamond = require("@/assets/resources/icon-diamond.svg");
const energy = require("@/assets/images/energy.jpeg");
const silver = require("@/assets/images/silver.jpeg");
const ore = require("@/assets/images/ore.jpeg");
const diamond = require("@/assets/images/diamond.jpeg");
const photo1 = require("@/assets/images/pexels-photo-440731.jpeg");
const photo2 = require("@/assets/images/pexels-photo-459728.jpeg");
const photo3 = require("@/assets/images/solar-panel-array-power-sun-electricity-159397.jpeg");
const techBackground = require("@/assets/images/tech-background.webp");
const tech1 = require("@/assets/images/tech-texture-1.svg");
const tech2 = require("@/assets/images/tech-texture-2.svg");
const tech3 = require("@/assets/images/tech-texture-3.svg");
const tech4 = require("@/assets/images/tech-texture-4.svg");
const tech5 = require("@/assets/images/tech-texture-5.svg");
const tech6 = require("@/assets/images/tech-texture-6.svg");
const tech7 = require("@/assets/images/tech-texture-7.svg");
//const gameConfigJson = require("@/assets/data/gamedata.json");


const assets:Asset[] = [];
let game:Game;

function createAsset(id:string,type:'image'|'sound'|'text'|'json',url:string,data:any = null):Asset{
    return {id,type,url,data}
}

function defineAssets(){
    assets.push(
        createAsset(ConstantAssets.HEX_SELECTED,'image',hexSelected),
        createAsset(ConstantAssets.HEX_UNKNOWN,'image',hexUnknwon),
        createAsset(ConstantAssets.UI_OK,'image',ui_ok),
        createAsset(ConstantAssets.UI_CANCEL,'image',ui_cancel),
        createAsset('cell-texture-water','image',water1),
        createAsset('cell-texture-dirt1','image',dirt1),
        createAsset('cell-texture-dirt2','image',dirt2),
        createAsset('cell-texture-forest1','image',forest1),
        createAsset('cell-texture-forest2','image',forest2),        
        createAsset('cell-image-swamp','image',swamp1),
        createAsset('cell-image-swamp2','image',swamp2),
        createAsset('cell-image-beach','image',beach),
       
        createAsset('icon-building','image',iconbuilding),
        createAsset('icon-cell','image',iconcell),
        createAsset(ConstantAssets.ICON_BUILD,'image',iconbuild),
        createAsset(ConstantAssets.TECH_BACKGROUND,'image',techBackground),
        createAsset('structure-texture-shop1','image',texturestructureshop1),
    
        createAsset('placeable-texture-1','image',btex1),

        createAsset('structure-image-struct1','image',structure1),
        createAsset('structure-image-struct2','image',structure2),
        createAsset('structure-image-struct3','image',structure3),
        createAsset('structure-image-struct4','image',structure4),
        createAsset('structure-image-struct5','image',structure5),
       
        createAsset('tech-texture-1','image',tech1),
        createAsset('tech-texture-2','image',tech2),
        createAsset('tech-texture-3','image',tech3),
        createAsset('tech-texture-4','image',tech4),
        createAsset('tech-texture-5','image',tech5),
        createAsset('tech-texture-6','image',tech6),
        createAsset('tech-texture-7','image',tech7),


        createAsset('resource-icon-energy','image',iconenergy),
        createAsset('resource-icon-silver','image',iconsilver),
        createAsset('resource-icon-ore','image',iconore),
        createAsset('resource-icon-diamond','image',icondiamond),
    
        createAsset('resource-image-energy','image',energy),
        createAsset('resource-image-silver','image',silver),
        createAsset('resource-image-ore','image',ore),
        createAsset('resource-image-diamond','image',diamond),
        
        createAsset('image1','image',photo1),
        createAsset('image2','image',photo2),
        createAsset('image3','image',photo3),
    );
}

defineAssets();

function randomizeMediaAssets(media:Media){
    media.icon = randomItem(assets);
    media.image = randomItem(assets);
    media.thumbnail = randomItem(assets);
}

export function randomizeGameAssets(game:Game){
    game.cells.forEach( cell => {
        randomizeMediaAssets(cell.media)
        cell.texture = randomItem(assets.filter( asset => asset.id.startsWith('cell-texture')));
        console.log(cell.texture);
    });
    game.placeables.forEach( placeable => {
        randomizeMediaAssets(placeable.media)
        placeable.texture = randomItem(assets.filter( asset => asset.id.startsWith('placeable-texture')));
    });
    game.technologies.forEach( tech => {
        /* Rellena de forma recursiva todo este arbol tecnológico */
        function techMediaFiller(tech:Technology){
            tech.texture = randomItem(assets.filter( asset => asset.id.startsWith('tech-texture')));
            randomizeMediaAssets(tech.media)
            tech.unlocks.forEach(techMediaFiller);
        }

        techMediaFiller(tech);
    });
    game.resources.forEach( res => randomizeMediaAssets(res.media));
    game.activities.forEach( activity => randomizeMediaAssets(activity.media));
    
    randomizeMediaAssets(game.media);   
}


export function createPlayer():Player{
    return {
        birthDate:new Date(),
        email:randomName()+'@here.com',
        name:randomName(),
        password:'',
        surname:randomName(),
        id:'generated-plyaer-'+randomInt(100)
    }
}

export function getAssets():Asset[]{
    return assets;
}

export function createGameList():Partial<Game>[]{
    return games.map( game => ({id:game.id,media:game.media}));
}

export function createSinglePlayerMatch(player:Player):[GameInstance,Game]{
    const instance = randomItem(gameInstances);
    
    const game = games.filter(game => instance.gameId == game.id)[0];
    randomizeGameAssets(game);
    // Añadir el jugador
    instance.players.push({
        playerId:player.id!,
        stockpiles:game.resources.map( resource => ({resourceId:resource.id,amount:100}) ),
        queue:[],
        technologies:range(5).map( i => randomItem(game.technologies).id )
    });
    // Asignar unas celdas
    const areaSize = 50;
    const startPos:Vector = new Vector(0,0);//new Vector(areaSize+randomInt(MAP_SIZE - areaSize),areaSize+randomInt(MAP_SIZE - areaSize));
    for(let x = 0; x< areaSize; x++){
        for(let y = 0; y<areaSize; y++){
            instance.cells[ (y+startPos.y)*MAP_SIZE + (x+startPos.x)].playerId = player.id;
        }
    }

    return [instance,game];
}
