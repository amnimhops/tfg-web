import { CellInstance } from "./cells";
import { Stockpile } from "./resources";

export class Player{
    constructor(private cells:CellInstance[], private stockpiles:Stockpile[]){

    }

    getCells():CellInstance[]{
        return this.cells;
    }
    getStockpiles():Stockpile[]{
        return this.stockpiles;
    }
}