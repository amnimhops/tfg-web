import { Asset } from "./assets";

export class Info {
    constructor(private id: string, private name: string, private description: string, private icon: Asset, private image: Asset) { }

    getId(): string {
        return this.id;
    }
    getName(): string {
        return this.name;
    }
    getDescription(): string {
        return this.description;
    }
    getIcon(): Asset {
        return this.icon;
    }
    getImage(): Asset {
        return this.image;
    }

    getPath() {
        throw new Error('getPath() must be overriden');
    }
}

export interface InfoPanelTarget {
    title: string;
    description: string;
    image: string;
    resourceFluxes: string[];
    path: string[];
    activities: InfoPanelActivity[];
}
export interface InfoPanelActivity {
    icon: string;
    label: string;
    callback(data:any): void;
}
