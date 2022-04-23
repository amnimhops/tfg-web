import { ActivityType, Asset, FlowPeriodicity, Game, GameInstance, Media, Player, Technology, Vector } from "shared/monolyth";
import {players, games, gameInstances, randomName, MAP_SIZE, randomMedia, randomText} from "shared/mocks/";
import { randomInt, randomItem, range } from "shared/functions";
import { ConstantAssets } from "../classes/assetManager";
import { CellIPTarget } from "../classes/info";


const hexSelected = require("@/assets/resources/hex-selected.png");
const hexUnknwon = require("@/assets/resources/hex-unknown.png");

const ui_ok = require("@/assets/ui/icon-accept.svg");
const ui_cancel = require("@/assets/ui/icon-close.svg");
const ui_warning = require("@/assets/ui/icon-warning.svg");
const ui_add = require("@/assets/ui/icon-add.svg");
const ui_delete = require("@/assets/ui/icon-delete.svg");

const iconSectionArea = require('@/assets/resources/icon-section-area.svg');
const iconSectionResources = require('@/assets/resources/icon-section-resources.svg');
const iconSectionTechnology = require('@/assets/resources/icon-section-technologies.svg');
const iconSectionWorld = require('@/assets/resources/icon-section-world.svg');
const iconSectionActivity = require('@/assets/resources/icon-section-activities.svg');
const iconSectionMessage = require('@/assets/resources/icon-section-messages.svg');

const iconbuild = require("@/assets/resources/icon-build.svg");
const iconresearch = require("@/assets/resources/icon-research.svg");
const icondismantle = require("@/assets/resources/icon-dismantle.svg");
const iconspy = require("@/assets/resources/icon-spy.svg");
const icontrade = require("@/assets/resources/icon-trade.svg");
const iconattack = require("@/assets/resources/icon-attack.svg");
const iconclaim = require("@/assets/resources/icon-claim.svg");
const iconexplore = require("@/assets/resources/icon-explore.svg");
const iconmessage = require("@/assets/resources/icon-section-messages.svg");

const water1 = require("@/assets/resources/water-1.png");
const dirt1 = require("@/assets/resources/dirt-1.png");
const dirt2 = require("@/assets/resources/dirt-2.png");
const forest1 = require("@/assets/resources/forest-1.png");
const forest2 = require("@/assets/resources/forest-2.png");    
const swamp1 = require("@/assets/images/swamp1.jpeg");
const swamp2 = require("@/assets/images/swamp2.jpg");
const beach = require("@/assets/images/beach.jpeg");
const iconbuilding = require("@/assets/resources/icon-building.svg");

const iconcell = require("@/assets/resources/icon-cell.svg");
const iconplayers = require("@/assets/resources/icon-players.svg");

const iconMsgMessage = require("@/assets/ui/icon-msg-message.svg");
const iconMsgNotification = require("@/assets/ui/icon-msg-notification.svg");
const iconMsgReport = require("@/assets/ui/icon-msg-report.svg");


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

const homeBackground = require("@/assets/images/home-background.png");
const techBackground = require("@/assets/images/tech-background.webp");
const resourceBackground = require("@/assets/images/resource-background.png");
const messagingBackground = require("@/assets/images/messaging-background.webp");
const tech1 = require("@/assets/images/tech-texture-1.svg");
const tech2 = require("@/assets/images/tech-texture-2.svg");
const tech3 = require("@/assets/images/tech-texture-3.svg");
const tech4 = require("@/assets/images/tech-texture-4.svg");
const tech5 = require("@/assets/images/tech-texture-5.svg");
const tech6 = require("@/assets/images/tech-texture-6.svg");
const tech7 = require("@/assets/images/tech-texture-7.svg");

const userProfile1 = require("@/assets/images/user-profile-1.webp");
const userProfile2 = require("@/assets/images/user-profile-2.webp");
const userProfile3 = require("@/assets/images/user-profile-3.webp");
const userProfile4 = require("@/assets/images/user-profile-4.webp");
const userProfile5 = require("@/assets/images/user-profile-5.webp");
const userProfile6 = require("@/assets/images/user-profile-6.jpg");

// Imagenes de assets de la seccion de mensajería
const msgReportImage = require("@/assets/images/image-messaging-report.webp")
const msgMessageImage = require("@/assets/images/image-messaging-message.png")
const msgNotificationImage = require("@/assets/images/image-messaging-notification.png")

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
        createAsset(ConstantAssets.UI_ADD,'image',ui_add),
        createAsset(ConstantAssets.UI_DELETE,'image',ui_delete),
        createAsset(ConstantAssets.UI_CANCEL,'image',ui_cancel),
        createAsset(ConstantAssets.UI_WARNING,'image',ui_warning),
        
        createAsset(ConstantAssets.ICON_DISMANTLE,'image',icondismantle),
        createAsset(ConstantAssets.ICON_BUILD,'image',iconbuild),
        createAsset(ConstantAssets.ICON_RESEARCH,'image',iconresearch),
        createAsset(ConstantAssets.ICON_SPY,'image',iconspy),
        createAsset(ConstantAssets.ICON_TRADE,'image',icontrade),
        createAsset(ConstantAssets.ICON_ATTACK,'image',iconattack),
        createAsset(ConstantAssets.ICON_CLAIM,'image',iconclaim),
        createAsset(ConstantAssets.ICON_EXPLORE,'image',iconexplore),
        createAsset(ConstantAssets.ICON_MESSAGE,'image',iconmessage),

        createAsset(ConstantAssets.ICON_SECTION_AREA,'image',iconSectionArea),
        createAsset(ConstantAssets.ICON_SECTION_RESOURCES,'image',iconSectionResources),
        createAsset(ConstantAssets.ICON_SECTION_TECHNOLOGY,'image',iconSectionTechnology),
        createAsset(ConstantAssets.ICON_SECTION_WORLD,'image',iconSectionWorld),
        createAsset(ConstantAssets.ICON_SECTION_ACTIVITIES,'image',iconSectionActivity),
        createAsset(ConstantAssets.ICON_SECTION_MESSAGES,'image',iconSectionMessage),

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

        createAsset(ConstantAssets.ICON_PLAYERS,'image',iconplayers),

        createAsset(ConstantAssets.ICON_MSG_MESSAGE,'image',iconMsgMessage),
        createAsset(ConstantAssets.ICON_MSG_NOTIFICATION,'image',iconMsgNotification),
        createAsset(ConstantAssets.ICON_MSG_REPORT,'image',iconMsgReport),

        
        createAsset(ConstantAssets.TECH_BACKGROUND,'image',techBackground),
        createAsset(ConstantAssets.RESOURCE_BACKGROUND,'image',resourceBackground),
        createAsset(ConstantAssets.HOME_BACKGROUND,'image',homeBackground),
        createAsset(ConstantAssets.MESSAGING_BACKGROUND,'image',messagingBackground),

        createAsset(ConstantAssets.MESSAGING_MESSAGE,'image',msgMessageImage),
        createAsset(ConstantAssets.MESSAGING_NOTIFICATION,'image',msgNotificationImage),
        createAsset(ConstantAssets.MESSAGING_REPORT,'image',msgReportImage),
        
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

        createAsset('user-profile-1','image',userProfile1),
        createAsset('user-profile-2','image',userProfile2),
        createAsset('user-profile-3','image',userProfile3),
        createAsset('user-profile-4','image',userProfile4),
        createAsset('user-profile-5','image',userProfile5),
        createAsset('user-profile-6','image',userProfile6)
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

    });
    game.placeables.forEach( placeable => {
        randomizeMediaAssets(placeable.media)
        placeable.texture = randomItem(assets.filter( asset => asset.id.startsWith('placeable-texture')));
    });
    game.technologies.forEach( tech => {
        tech.texture = randomItem(assets.filter( asset => asset.id.startsWith('tech-texture')));
        randomizeMediaAssets(tech.media)
    });
    game.resources.forEach( res => randomizeMediaAssets(res.media));
    
    const iconsPerActivity = [
        {type:ActivityType.Attack,asset:assets.find( asset => asset.id == ConstantAssets.ICON_ATTACK)},
        {type:ActivityType.Build,asset:assets.find( asset => asset.id == ConstantAssets.ICON_BUILD)},
        {type:ActivityType.Claim,asset:assets.find( asset => asset.id == ConstantAssets.ICON_CLAIM)},
        {type:ActivityType.Dismantle,asset:assets.find( asset => asset.id == ConstantAssets.ICON_DISMANTLE)},
        {type:ActivityType.Explore,asset:assets.find( asset => asset.id == ConstantAssets.ICON_EXPLORE)},
        {type:ActivityType.Research,asset:assets.find( asset => asset.id == ConstantAssets.ICON_RESEARCH)},
        {type:ActivityType.Spy,asset:assets.find( asset => asset.id == ConstantAssets.ICON_SPY)},
        {type:ActivityType.Trade,asset:assets.find( asset => asset.id == ConstantAssets.ICON_TRADE)},
        {type:ActivityType.Message,asset:assets.find( asset => asset.id == ConstantAssets.ICON_MESSAGE)}

    ]
    game.activities.forEach( activity => {
        randomizeMediaAssets(activity.media)
        activity.media.icon = iconsPerActivity.find( ipa => ipa.type == activity.type)!.asset!;
    });
    
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
        media:randomMedia(),
        technologies:game.technologies.filter(tech => tech.parent == null).map(tech=>tech.id)
    });
    // Ajustar los medios de los jugadores
    instance.players.forEach( player => {
        player.media.name = 'Player '+randomName()
        player.media.image = randomItem(assets.filter(asset => asset.id.startsWith('user-profile')));
    });
    // Asignar unas celdas
    const areaSize = 50;
    const startPos:Vector = new Vector(0,0);//new Vector(areaSize+randomInt(MAP_SIZE - areaSize),areaSize+randomInt(MAP_SIZE - areaSize));
    for(let x = 0; x< areaSize; x++){
        for(let y = 0; y<areaSize; y++){
            const ci = instance.cells[ (y+startPos.y)*MAP_SIZE + (x+startPos.x)];
            ci.playerId = player.id||null;

            const cell = game.cells.find(c => c.id == ci.cellId);
            cell?.allowedPlaceableIds.forEach( pid => {
                if(Math.random() > .75){
                    ci.placeables.push({
                        id:-1,
                        instanceFlows: [
                            {amount:Math.random()*100,periodicity:FlowPeriodicity.PerSecond,resourceId:randomItem(game.resources).id}, // IRREALES, FALSOS, NO SE CORRESPPONDEN CON EL ORIGINAL
                            {amount:-Math.random()*88,periodicity:FlowPeriodicity.PerSecond,resourceId:randomItem(game.resources).id}
                        ],
                        placeableId:pid
                    })
                }
            })
        }
    }

    console.log('Tamaño de la instancia:',JSON.stringify(instance).length)
    return [instance,game];
}
