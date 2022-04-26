<template>
    <!-- Buildings -->
    <UISection title="Construcciones" class="ml-10" v-if="builtPlaceables.length > 0">
        <UIFlex padding="10">
            <UIButton v-for="(placeable,index) in builtPlaceables" :key="index" :borderless="true" :rounded="false" grow @onClick="openBuilding(placeable)">
                <UIIcon :src="placeable.media.icon.url" size="large" />
                <UILabel>{{placeable.media.name}}</UILabel>
            </UIButton>
        </UIFlex>
    </UISection>
    <!-- Sección de elementos actualmente en construcción -->
    <UISection title="En cola" class="ml-10" v-if="buildActivities.length > 0">
        <UIFlex padding="10" gap="10">
            <EnqueuedActivityInfo v-for="(ba,index) in buildActivities" :key="index" :data="ba" />
        </UIFlex>
    </UISection>
    <!-- Activities -->
    <UISection title="Actividades" class="ml-10">
        <UIFlex padding="10">
            <UIButton :borderless="true" :rounded="false" grow @onClick="showStructurePicker(true)">
                <UIIcon :src="buildIcon" size="large" />
                <UILabel>Construir</UILabel>
            </UIButton>
        </UIFlex>
    </UISection>

    <BuildingPicker
        v-if="picker"
        @onClose="showStructurePicker(false)"
        :structures="availableStructures"
        :cell="target.cellInstance"
        @onSelect="confirm"
    />
    <ActivityConfirmation 
        v-if="activityConfirmationModel" 
        :model="activityConfirmationModel" 
        @onCancel="closeActivityConfirmationDialog" 
        @onAccept="startActivity"
    />
</template>

<script lang="ts">
import BuildingPicker from "../game/BuildingPicker.vue";
import ActivityConfirmation from "../game/ActivityConfirmation.vue";
import {deleteIcon} from '../ui/icons';
import { CellIPTarget, ExistingPlaceableIPTarget } from '@/game/classes/info'
import { GameEvents, useGameAPI } from '@/game/services/gameApi'
import { ActivityType, Media, WithMedia, PlaceableInstance, Placeable } from 'shared/monolyth'
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref } from 'vue'
import { showInfoPanel2 } from '@/game/controllers/ui'
import { AssetManager, ConstantAssets } from '@/game/classes/assetManager'
import { BuildingActivityTarget, useActivityConfirmation } from '@/game/classes/activities'

import * as UI from '../ui/';
import EnqueuedActivityInfo, { EnqueuedActivityInfoModel } from '../game/EnqueuedActivityInfo.vue';

type PlaceableInstanceView = PlaceableInstance & {
    media:Media;
    underConstruction:boolean;
    constructionProgress?:number;
    countdown?:string
}

export default defineComponent({
    components:{...UI,EnqueuedActivityInfo,BuildingPicker,ActivityConfirmation},
    props:{
        target:Object as PropType<CellIPTarget>
    },
    setup(props) {
        const api = useGameAPI();
        const apiChanged = ref<number>(Date.now());
        const gameData = api.getGameData();
        const picker = ref(false);
        const buildIcon = AssetManager.get(ConstantAssets.ICON_BUILD).url;
        const {activityConfirmationModel,openActivityConfirmationDialog,closeActivityConfirmationDialog,startActivity} = useActivityConfirmation();
        
        // Lista de edificios construibles que mostrará el selector de edificios
        const availableStructures = computed<Placeable[]>(()=>{
            const cellInstance = props.target?.cellInstance;
            return gameData.cells[cellInstance!.cellId].allowedPlaceableIds.map( id => api.getPlaceable(id));
        });
        // Saca el popup de confirmación de inicio de actividad usando el edificio seleccionado
        const confirm = (placeable:Placeable)=>{
            showStructurePicker(false);
            openActivityConfirmationDialog('Comenzar construcción',ActivityType.Build,{
                name:props.target?.media?.name,
                cellInstanceId:props.target?.cellInstance.id,
                placeableInstanceId:null,
                placeableId:placeable.id
            } as BuildingActivityTarget);
        }
        // Activa/desactiva la visibilidad del selector de edificios
        const showStructurePicker: (value:boolean) => void = (value:boolean)=> picker.value = value;
        
        // Cambia el panel a la ficha del edificio asociado al emplazable seleccionado
        const openBuilding = (model:WithMedia<PlaceableInstance>) => {
            if(props.target){
                showInfoPanel2(new ExistingPlaceableIPTarget(props.target.cellInstance,model));
            }  
        }
        // Actualiza el flag de cambios del API
        const handleApiChanges = ()=>{
            apiChanged.value = Date.now();
        }

        // Obtiene reactivamente la listsa de edificios construidos
        const builtPlaceables = computed<PlaceableInstanceView[]>( ()=> {
            apiChanged.value;

            return props.target?.cellInstance.placeables.filter( pInstance => pInstance.built == true).map( pInstance => ({
                ...pInstance,
                underConstruction: false,
                media:gameData.placeables[pInstance.placeableId].media
            })) || [];
        });
        // Obtiene reactivamente la lista de actividades asociadas en curso
        const buildActivities = computed<EnqueuedActivityInfoModel[]>( () => {
            apiChanged.value;

            const cellInstance = props.target!.cellInstance;
            const placeables:EnqueuedActivityInfoModel[] = [];
            const buildingActivities = api
                .getQueueByType(ActivityType.Build)
                .filter( ea => (ea.target as BuildingActivityTarget).cellInstanceId == cellInstance.id);

            buildingActivities.forEach( ea => {
                const target = ea.target as BuildingActivityTarget;
                const pInstance = cellInstance.placeables.find( pi => pi.id == target.placeableInstanceId);
                if(pInstance){
                    const media = gameData.placeables[pInstance.placeableId].media;
                    placeables.push({activity:ea,media});
                }
            });
            
            return placeables;
        })

        onMounted(()=>{
            // Conectamos el componente con el temporizador de la API
            api.on(GameEvents.Timer, handleApiChanges);
        })
        onUnmounted(()=>{
            // Desonectamos el componente del temporizador de la API
            api.off(GameEvents.Timer,handleApiChanges);
        })

        return {
            /* Iconos */
            buildIcon,deleteIcon,
            /* Datos */
            buildActivities,builtPlaceables,activityConfirmationModel,picker,availableStructures,
            /* Acciones */
            openBuilding,confirm,closeActivityConfirmationDialog,showStructurePicker,startActivity
            
        }
    },
})
</script>

<style>

</style>