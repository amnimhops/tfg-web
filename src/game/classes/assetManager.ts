import { Asset } from "@/shared/monolyth";

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
    UI_DELETE:'ui-delete',
    /* Activities */
    ICON_BUILD:'icon-build',
    ICON_DISMANTLE:'icon-dismantle',
    ICON_SPY:'icon-spy',
    ICON_TRADE:'icon-trade',
    ICON_ATTACK:'icon-attack',
    ICON_CLAIM:'icon-claim',
    ICON_EXPLORE:'icon-explore',
    ICON_RESEARCH:'icon-research',
    ICON_MESSAGE:'icon-message',
    /* Map / Cells */
    HEX_SELECTED:'hex-selected',
    HEX_UNEXPLORED:'hex-unexplored',
    
    /* Section icons */
    ICON_SECTION_AREA:'icon-section-area',
    ICON_SECTION_RESOURCES:'icon-section-resources',
    ICON_SECTION_TECHNOLOGY:'icon-section-technology',
    ICON_SECTION_WORLD:'icon-section-world',
    ICON_SECTION_ACTIVITIES:'icon-section-activities',
    ICON_SECTION_MESSAGES:'icon-section-messages',
    
    /* More icons */
    ICON_PLAYERS:'icon-players',
    ICON_MSG_MESSAGE:'icon-msg-message',
    ICON_MSG_NOTIFICATION:'icon-msg-notification',
    ICON_MSG_REPORT:'icon-msg-report',
    
    /* Section backgrounds */
    TECH_BACKGROUND: 'tech-background',
    HOME_BACKGROUND: 'home-background',
    RESOURCE_BACKGROUND: 'resource-background',
    MESSAGING_BACKGROUND: 'messaging-background',
    ACTIVITY_BACKGROUND: 'activity-background',

    /* Messaging section assets */
    MESSAGING_MESSAGE : 'messaging-message-image',
    MESSAGING_NOTIFICATION : 'messaging-notification-image',
    MESSAGING_REPORT : 'messaging-report-image',

    /* Elementos desconocidos */
    UNKNOWN_IMAGE:'unknown_image'
}

export const ASSET_EMPTY:Asset = {
    id:'',
    type:'image',
    url:'',
    data:null
}