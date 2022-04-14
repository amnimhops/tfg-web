import { ActivityTarget, Technology } from "shared/monolyth";

export class ActivityAvailability{
    constructor(public available:boolean, public type:ActivityTarget, public target:ActivityTarget, public info:string[]){

    }
}

export class BuildingActivityTarget implements ActivityTarget{
    constructor(public cellInstanceId:number, public placeableId:string){}
}

export class ResearchActivityTarget implements ActivityTarget{
    constructor(public tech:Technology){}
}

