<template>
    <UIFlex gap="20">
        <!-- Buildings -->
        <UISection title="Construcciones" class="ml-10" v-if="builtPlaceables.length > 0">
            <UIFlex padding="10" gap="10">
                <UIFlex direction="row" v-for="(placeable,index) in builtPlaceables" :key="index" alignItems="center" gap="10">
                    <UIIcon :src="placeable.media.icon.url" size="large" />
                    <UILabel @onClick="openBuilding(placeable)" link>{{placeable.media.name}}</UILabel>
                </UIFlex>
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
                <UIButton :borderless="true" grow @onClick="showBuildingList">
                    <UIIcon :src="buildIcon" size="large" />
                    <UILabel>Construir</UILabel>
                </UIButton>
            </UIFlex>
        </UISection>
    </UIFlex>
</template>

<script lang="ts">
import {deleteIcon} from '../ui/icons';
import { CellIPTarget, ExistingPlaceableIPTarget, PickBuildingIPTarget } from '@/game/classes/info'
import { GameEvents, useGameAPI } from '@/game/services/gameApi'
import { ActivityType, Media, PlaceableInstance, EnqueuedActivity } from 'shared/monolyth'
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref } from 'vue'
import { showInfoPanel2 } from '@/game/controllers/ui'
import { AssetManager, ConstantAssets } from '@/game/classes/assetManager'
import { BuildingActivityTarget } from '@/game/classes/activities'

import * as UI from '../ui/';
import EnqueuedActivityInfo from '../game/EnqueuedActivityInfo.vue';

type PlaceableInstanceView = PlaceableInstance & {
    media:Media;
    underConstruction:boolean;
    constructionProgress?:number;
    countdown?:string
}

export default defineComponent({
    components:{...UI,EnqueuedActivityInfo},
    props:{
        target:Object as PropType<CellIPTarget>
    },
    setup(props) {
        const api = useGameAPI();
        const apiChanged = ref<number>(Date.now());
        const gameData = api.getGameData();
        const buildIcon = AssetManager.get(ConstantAssets.ICON_BUILD).url;

        const showBuildingList = ()=>{
            showInfoPanel2(new PickBuildingIPTarget(props.target!.cellInstance));
        }
       
        // Cambia el panel a la ficha del edificio asociado al emplazable seleccionado
        const openBuilding = (model:PlaceableInstance) => {
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
        const buildActivities = computed<EnqueuedActivity[]>( () => {
            apiChanged.value;

            const cellInstance = props.target!.cellInstance;
            return api
                .getQueueByType(ActivityType.Build)
                .filter( ea => (ea.target as BuildingActivityTarget).cellInstanceId == cellInstance.id);
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
            buildActivities,builtPlaceables,
            /* Acciones */
            showBuildingList,openBuilding
        }
    },
})
</script>

<style>

</style>