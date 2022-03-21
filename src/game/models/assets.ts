export class Asset{
    /**
     * Define un nuevo recurso
     * @param {string} id - Identificador del recurso
     * @param {string} type - Tipo de recurso, toma como valor 'image', 'sound' o 'string'
     * @param {string} url - Dirección donde se puede obtener el recurso
     * @param {any} data - Contenido del recurso (img, sound, text, etc)
     */
    constructor(private id:string,private type:string,private url:string, private data?:any){}
    
    public getId():string{
        return this.id
    }

    public getType():string{
        return this.type;
    }
    public getUrl():string{
        return this.url;
    }
    public getData():any{
        return this.data;
    }
}

export class AssetManager {
    private static assets:{[name:string]:Asset} = {};
    
    public static add(asset:Asset){
        AssetManager.assets[asset.getId()] = asset;
    }

    public static get(id:string){
        return AssetManager.assets[id];
    }
}

export const ConstantAssets = {
    ICON_BUILD:'icon-build'
}