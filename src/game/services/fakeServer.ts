import { Activity } from "../models/activities";
import { Asset, ConstantAssets } from "../models/assets";
import { Cell, CellInstance } from "../models/cells";
import { Placeable, PlaceableInstance, Structure } from "../models/placeables";
import { Player } from "../models/players";
import { Resource, Stockpile } from "../models/resources";
import { Technology } from "../models/technologies";
import { Vector } from "../models/vector";
import { WorldDescriptor } from "../models/worldDescriptor";


const hexSelected = require("@/assets/resources/hex-selected.png");
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

class FakeState{
    cells:Cell[] = [];
    assets:Asset[] = [];
    resources:Resource[] = [];
    placeables:Placeable[] = [];
}

const state:FakeState = new FakeState();

function randomInt(max:number){
    return Math.floor(Math.random() * max);
}
function randomProbability(p:number){
    return Math.random() >= (p || 0.5);
}

function randomText(words:number){
    const lipsum = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin congue, nibh vitae lobortis cursus, sapien risus sollicitudin justo, et venenatis diam odio eu turpis. Proin convallis leo ante, a ultrices tortor interdum at. Donec purus lorem, lobortis vel pellentesque id, eleifend id purus. Cras tristique erat sit amet nisl cursus, a pulvinar dui fringilla. Nunc ultricies, leo quis feugiat accumsan, arcu dolor commodo velit, non finibus dolor sapien et lacus. Cras sed erat magna. Proin tellus sapien, eleifend quis euismod eu, vulputate in nunc. Praesent ut lacus ut augue maximus ornare.",
        "Duis nisi felis, fringilla a iaculis a, suscipit quis nulla. Mauris ac diam velit. Suspendisse finibus justo ut sagittis maximus. Nunc luctus placerat nisl maximus placerat. Sed non mi sed lectus faucibus efficitur. Duis vitae lorem pellentesque, lobortis lorem id, imperdiet nulla. Duis id ullamcorper turpis. Donec vel quam nisi. Aliquam erat volutpat. Aliquam sed pellentesque mauris. Donec eros diam, commodo ac enim ut, dictum auctor lectus.",
        "Morbi sit amet ante sed libero mollis euismod pulvinar et elit. Sed accumsan nulla a turpis gravida, non porttitor dolor finibus. Aenean hendrerit, eros in blandit consequat, dolor turpis laoreet massa, in iaculis ipsum libero id orci. Nunc non lorem ligula. Nullam ipsum nunc, egestas id dictum eu, fermentum viverra massa. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum eget justo convallis, euismod lorem sed, euismod tellus. Vestibulum vel lectus nec augue blandit congue vitae id justo. Aenean fermentum placerat erat a ullamcorper. Vestibulum tellus mauris, convallis eget tempus eu, euismod ac odio. In quis lectus et nisi tincidunt dapibus. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Etiam blandit pretium diam, non rhoncus velit auctor at.",
        "Proin ac orci in massa ornare venenatis. Cras at blandit neque. Fusce vel fringilla mauris. Praesent eget risus eget erat rutrum egestas. Aliquam tincidunt velit hendrerit lacus pretium aliquam. Etiam et auctor ligula. Donec eget mi ipsum.",
        "Integer facilisis sollicitudin efficitur. Maecenas quis neque vitae arcu interdum viverra. Aenean dignissim molestie ipsum non varius. Integer sit amet lectus imperdiet, auctor tortor a, placerat massa. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Sed eu ante enim. Donec vitae pulvinar nibh, non dictum eros. Nulla facilisi. Phasellus non ex ullamcorper, maximus massa et, hendrerit odio. Proin in nisi quis tellus scelerisque commodo et vitae est. Phasellus iaculis tellus ut iaculis laoreet."
    ];
    const text = [];let i = 0; let j = 0;
    while(words-- > 0){
        const sentenceWords = lipsum[i++ % lipsum.length].split(' ');
        const word = sentenceWords[j++ % sentenceWords.length];
        text.push(word);
    }
    return text.join(' ');
}
function randomItem(list:any[]){
    if(list.length > 0){
        return list[randomInt(list.length)];
    }else{
        throw new Error('The list is empty')
    }
}
function index(array:any[],keyfn:(element: any) => string): any{
    const obj: {[key:string]:any} = {};
    const values = array.map( element => ({key:keyfn(element),value:element}));
    values.forEach( v => obj[v.key] = v.value);
    return obj;
}

function randomName(prefix:string){
    const dict:string[] = "abcdefghijklmnñopqrstuvwxyz ".split('');
    const rnd = Math.random() * 10;
    const name:string[] = [];
    for(let i = 0;i<3+rnd;i++){
        name.push(randomItem(dict));
    }
    return prefix+name.join('');
}

function defineAssets(){
    state.assets = [
        new Asset('cell-highlight','image',hexSelected),
        new Asset('cell-texture-water','image',water1),
        new Asset('cell-texture-dirt1','image',dirt1),
        new Asset('cell-texture-dirt2','image',dirt2),
        new Asset('cell-texture-forest1','image',forest1),
        new Asset('cell-texture-forest2','image',forest2),        
        new Asset('cell-image-swamp','image',swamp1),
        new Asset('cell-image-swamp2','image',swamp2),
        new Asset('cell-image-beach','image',beach),
       
        new Asset('icon-building','image',iconbuilding),
        new Asset('icon-cell','image',iconcell),
        new Asset(ConstantAssets.ICON_BUILD,'image',iconbuild),
    
        new Asset('structure-texture-shop1','image',texturestructureshop1),
    
        new Asset('structure-image-struct1','image',structure1),
        new Asset('structure-image-struct2','image',structure2),
        new Asset('structure-image-struct3','image',structure3),
        new Asset('structure-image-struct4','image',structure4),
        new Asset('structure-image-struct5','image',structure5),
       
        new Asset('resource-icon-energy','image',iconenergy),
        new Asset('resource-icon-silver','image',iconsilver),
        new Asset('resource-icon-ore','image',iconore),
        new Asset('resource-icon-diamond','image',icondiamond),
    
        new Asset('resource-image-energy','image',energy),
        new Asset('resource-image-silver','image',silver),
        new Asset('resource-image-ore','image',ore),
        new Asset('resource-image-diamond','image',diamond),
        
        new Asset('image1','image',photo1),
        new Asset('image2','image',photo2),
        new Asset('image3','image',photo3),
    ];
}

export function getAssets():Asset[]{
    return state.assets;
}

function defineCells(n:number):void{
    const cellTextures = state.assets.filter( asset => asset.getId().startsWith('cell-texture'));
    const cellImages = state.assets.filter( asset => asset.getId().startsWith('cell-image'));
    const allowedPlaceables = state.placeables.filter( () => randomProbability(0.2) );
    const cellIcon = state.assets.filter( asset => asset.getId() == 'icon-cell')[0];
    for(let i = 0; i < n; i++){
        state.cells.push(new Cell(
            ''+i,
            randomName('cell-'),
            randomName('cell description'),
            cellIcon,
            randomItem(cellImages),
            randomItem(cellTextures),
            allowedPlaceables
        ));
    }
}

function definePlaceables(n:number){
    //const structIcons = state.assets.filter( asset => asset.id.startsWith('structure-icon'));
    const structImages = state.assets.filter( asset => asset.getId().startsWith('structure-image'));
    const structTextures = state.assets.filter( asset => asset.getId().startsWith('structure-texture'));
    const buildIcon = state.assets.filter( asset => asset.getId() == 'icon-building')[0];
    for(let i = 0; i < n; i++){
        state.placeables.push(new Structure(
            'structure-'+i,
            randomName('structure-'),
            randomText(randomInt(30)),
            buildIcon,
            randomItem(structImages),
            randomItem(structTextures)
        ))   
    }
}

function defineResources(n:number){
    const resourceIcons = state.assets.filter( asset => asset.getId().startsWith('resource-icon'));
    const resourceImages = state.assets.filter( asset => asset.getId().startsWith('resource-image'));
    
    for(let i = 0; i < n; i++){
        state.resources.push(new Resource(
            'res-'+i,
            randomName('Resource '),
            randomName('This resource ...'),
            randomItem(resourceIcons),
            randomItem(resourceImages)
        ));
    }

    return null;
}

defineAssets();
defineResources(5);
definePlaceables(10);
defineCells(10);
/*
function createPlaceables(cellInfo){
    const placeables = [];
    cellInfo.pl
    state.placeables.forEach( placeable => {
        if(Math.random() > .2){
            placeables.push(new)
        }
    })
}*/
function createCells():CellInstance[]{
    const cells:CellInstance[] = [];    
    for(let i = 0;i < 25; i++){
        for(let j=0;j<25;j++){
            const v = new Vector(i,j);
            const cellInfo = randomItem(state.cells);
            const placeables:PlaceableInstance[] = [];//createPlaceables(cellInfo);
            cells.push(new CellInstance(cellInfo,v,placeables))
        }
    }

    return cells;
}

function createStockpiles():Stockpile[]{
    const stockpiles:Stockpile[] = [];
    state.resources.forEach( resource => stockpiles.push(new Stockpile(resource,9999)));

    return stockpiles;
}

export function createWorld():WorldDescriptor{
    const cells:Record<string,Cell> = index(state.cells, cell => cell.id);
    const technologies:Record<string,Technology> = {};
    const resources:Record<string,Resource> = index(state.resources, resource => resource.id);
    const placeables:Record<string,Placeable> = {};
    return new WorldDescriptor(cells,technologies,placeables,resources);
}
export function createPlayer():Player{
    return new Player(createCells(),createStockpiles());
}

export function addTask(activity:Activity){
    console.log('Doing task',activity);
}