import { Cell } from "./cells";
import { Placeable  } from "./placeables";
import { Resource } from "./resources";
import { Technology } from "./technologies";

export class WorldDescriptor {
    constructor(
        private cells: Record<string, Cell>,
        private technologies: Record<string, Technology>,
        private placeables: Record<string, Placeable>,
        private resources: Record<string, Resource>) { }

    getCells():Record<string,Cell>{
        return this.cells;
    }
    getTechnologies():Record<string,Technology>{
        return this.technologies;
    }
    getStructures():Record<string,Placeable>{
        return this.placeables;
    }
    getResources():Record<string,Resource>{
        return this.resources;
    }
}