import { ActivityTarget, ActivityType, Technology } from "shared/monolyth";

export interface ActivityAvailability{
    available:boolean;
    type:ActivityType;
    target:ActivityTarget;
    info:string[];
}

/**
 * Esta interfaz representa la información asociada a una
 * actividad de construcción de emplazables en una celda.
 */
export interface BuildingActivityTarget extends ActivityTarget{
    /**
     * Índice de la celda dentro de su instancia
     */
    cellInstanceId:number;
    /**
     * Identificador (que no indice) de la instancia del emplazable dentro de la celda.
     * Se usa un identificador en lugar de un índice porque, al contrario que las instancias
     * de las celdas, los emplazables varían a lo largo del ciclo de vida de la aplicación. Si
     * esta interfaz apunta a un índice concreto y mientras se construye se desmantela otro
     * emplazable, crearía inconsistencia en los datos.
     */
    placeableInstanceId:number|null;
    /**
     * Identificador del emplazable que se construye
     */
    placeableId:string;
}

export interface ResearchActivityTarget extends ActivityTarget{
    tech:Technology;
}

