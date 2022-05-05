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
        <UISection title="En cola" class="ml-10" v-if="runningActivities.length > 0">
            <UIFlex padding="10" gap="10">
                <EnqueuedActivityInfo v-for="(ba,index) in runningActivities" :key="index" :data="ba" />
            </UIFlex>
        </UISection>
        <!-- Activities -->
        <UISection title="Actividades" class="ml-10">
            <UIFlex padding="10">
                <UIButton :borderless="true" grow @onClick="showBuildingList" v-if="owned">
                    <UIIcon :src="buildIcon" size="large" />
                    <UILabel>Construir</UILabel>
                </UIButton>
            </UIFlex>
            <UIFlex padding="10" v-if="!explored">
                 <ActivityButton 
                    :type="explorationActivity.type" 
                    :target="explorationTarget" 
                    @onStarted="goBackInfoPanelHistory"
                />
            </UIFlex>
             <UIFlex padding="10" v-if="explored && !owned">
                 <ActivityButton 
                    :type="claimActivity.type" 
                    :target="claimTarget" 
                    @onStarted="goBackInfoPanelHistory"
                />
            </UIFlex>
            
            
        </UISection>
    </UIFlex>
</template>

<script lang="ts">
import {deleteIcon} from '../ui/icons';
import { CellIPTarget, ExistingPlaceableIPTarget, PickBuildingIPTarget } from '@/game/classes/info'
import { useGameAPI } from '@/game/services/gameApi'
import { GameEvents, ActivityType, Media, PlaceableInstance, EnqueuedActivity, CellInstance } from '@/shared/monolyth'
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref } from 'vue'
import { goBackInfoPanelHistory, showInfoPanel2 } from '@/game/controllers/ui'
import { AssetManager, ConstantAssets } from '@/game/classes/assetManager'
import { BuildingActivityTarget, ClaimActivityTarget, ExplorationActivityTarget } from '@/game/classes/activities'
import ActivityButton from '../game/ActivityButton.vue';
import * as UI from '../ui/';
import EnqueuedActivityInfo from '../game/EnqueuedActivityInfo.vue';

type PlaceableInstanceView = PlaceableInstance & {
    media:Media;
    underConstruction:boolean;
    constructionProgress?:number;
    countdown?:string
}

export default defineComponent({
    components:{...UI,EnqueuedActivityInfo,ActivityButton},
    props:{
        target:Object as PropType<CellIPTarget>
    },
    setup(props) {
        const api = useGameAPI();
        const apiChanged = ref<number>(Date.now());
        const gameData = api.getGameData();
        const buildIcon = AssetManager.get(ConstantAssets.ICON_BUILD).url;

        const explorationActivity = api.getActivity(ActivityType.Explore);
        const claimActivity = api.getActivity(ActivityType.Claim);
        const explorationTarget = computed<ExplorationActivityTarget>(()=>{
            apiChanged.value;

            return {
                cellInstanceId:props.target!.cellInstance.id
            }as ExplorationActivityTarget
        });
        const claimTarget = computed<ExplorationActivityTarget>(()=>{
            apiChanged.value;

            return {
                cellInstanceId:props.target!.cellInstance.id
            }as ExplorationActivityTarget
        });
        const owned = computed<boolean>(()=>{
            apiChanged.value;

            const player = api.getCurrentPlayer();
            return player.playerId == props.target!.cellInstance!.playerId;
        });
        const explored = computed<boolean>(()=>{
            apiChanged.value;

            const player = api.getCurrentPlayer();
            return player.exploredCells!.some( id => id == props.target!.cellInstance.id)
        });
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

        const handleCellChanges = (e:CellInstance)=> {
            console.log(e)
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
        const runningActivities = computed<EnqueuedActivity[]>( () => {
            apiChanged.value;

            const cellInstance = props.target!.cellInstance;
            const activities = [];
            activities.push(...api
                .getQueueByType(ActivityType.Build)
                .filter( ea => (ea.target as BuildingActivityTarget).cellInstanceId == cellInstance.id)
            );
            activities.push(...api
                .getQueueByType(ActivityType.Claim)
                .filter( ea=> (ea.target as ClaimActivityTarget).cellInstanceId == cellInstance.id)
            );
            activities.push(...api
                .getQueueByType(ActivityType.Explore)
                .filter( ea=> (ea.target as ExplorationActivityTarget).cellInstanceId == cellInstance.id)
            );

            return activities;
        })

        onMounted(()=>{
            // Conectamos el componente con el temporizador de la API
            api.on(GameEvents.Timer, handleApiChanges);
            // Hay que escuchar también los cambios sobre las celdas
            api.on(GameEvents.CellInstanceUpdated,handleCellChanges);
        })
        onUnmounted(()=>{
            // Desonectamos el componente del temporizador de la API
            api.off(GameEvents.Timer,handleApiChanges);
            api.off(GameEvents.CellInstanceUpdated,handleCellChanges);
        })

        return {
            /* Iconos */
            buildIcon,deleteIcon,
            /* Datos */
            runningActivities,builtPlaceables,
            explorationActivity,explorationTarget,
            claimActivity,claimTarget,
            owned,explored,
            /* Acciones */
            showBuildingList,openBuilding,goBackInfoPanelHistory
        }
    },
})
</script>

<style>

</style>