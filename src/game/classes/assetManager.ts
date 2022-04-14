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
    /* Icons */
    UI_OK:'icon-ok',
    UI_WARNING:'icon-warning',
    UI_CANCEL:'icon-cancel',
    UI_ADD:'icon-add',
    /* Activities */
    ICON_BUILD:'icon-build',
    ICON_DISMANTLE:'icon-dismantle',
    ICON_SPY:'icon-spy',
    ICON_TRADE:'icon-trade',
    ICON_ATTACK:'icon-attack',
    ICON_CLAIM:'icon-claim',
    ICON_EXPLORE:'icon-explore',
    ICON_RESEARCH:'icon-research',
    /* Map / Cells */
    HEX_SELECTED:'hex-selected',
    HEX_UNKNOWN:'hex-unknown',
    /* Section backgrounds */
    TECH_BACKGROUND: 'tech-background',
    RESOURCE_BACKGROUND: 'resource-background',
}