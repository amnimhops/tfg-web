import { ActivityTarget } from "shared/monolyth";

export class BuildingActivityTarget implements ActivityTarget{
    constructor(public cellInstanceId:number, public placeableId:string){}
}