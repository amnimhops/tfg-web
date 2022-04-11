import { Asset } from "shared/monolyth";

export class AssetManager {
    private static assets:{[name:string]:Asset} = {};
    
    public static add(asset:Asset){
        AssetManager.assets[asset.id] = asset;
    }

    public static get(id:string){
        return AssetManager.assets[id];
    }
}

export const ConstantAssets = {
    UI_OK:'icon-ok',
    UI_CANCEL:'icon-cancel',
    ICON_BUILD:'icon-build',
    HEX_SELECTED:'hex-selected',
    HEX_UNKNOWN:'hex-unknown',
    TECH_BACKGROUND: 'tech-background',
}