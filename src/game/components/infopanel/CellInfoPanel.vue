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
    <UISection title="En cola" class="ml-10" v-if="buildActivities.length > 0">
        <UIFlex padding="10">
            <EnqueuedActivityInfo v-for="(ba,index) in buildActivities" :key="index" :data="ba" />
        </UIFlex>
    </UISection>
    <!-- Activities -->
    <UISection title="Actividades" class="ml-10">
        <UIFlex padding="10">
            <UIButton :borderless="true" :rounded="false" grow @onClick="addNewBuilding">
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
        @onSelect="buildStructure"
    />
</template>

<script lang="ts">
import {countdown,countdownStr} from 'shared/functions';
import BuildingPicker from "../game/BuildingPicker.vue";

import {deleteIcon} from '../ui/icons';
import { CellIPTarget, ExistingPlaceableIPTarget } from '@/game/classes/info'
import { GameEvents, useGameAPI } from '@/game/services/gameApi'
import { ActivityType, Media, WithMedia, PlaceableInstance, Placeable } from 'shared/monolyth'
import { computed, defineComponent, onUnmounted, PropType, ref } from 'vue'
import { closeInfoPanel, showInfoPanel2 } from '@/game/controllers/ui'
import { AssetManager, ConstantAssets } from '@/game/classes/assetManager'
import { BuildingActivityTarget } from '@/game/classes/activities'

import * as UI from '../ui/';
import EnqueuedActivityInfo, { EnqueuedActivityInfoModel } from '../game/EnqueuedActivityInfo.vue';

type PlaceableInstanceView = PlaceableInstance & {
    media:Media;
    underConstruction:boolean;
    constructionProgress?:number;
    countdown?:string
}

export default defineComponent({
    components:{...UI,EnqueuedActivityInfo,BuildingPicker},
    props:{
        target:Object as PropType<CellIPTarget>
    },
    setup(props) {
        const api = useGameAPI();
        const picker = ref(false);
        const buildIcon = AssetManager.get(ConstantAssets.ICON_BUILD).url;
        
        /**
         * Al final todo se reduce a construir esto
         */
        const buildStructure: (placeable:Placeable) => void = async (placeable:Placeable) => {
            showStructurePicker(false);
            const target:BuildingActivityTarget = {
                cellInstanceId:props.target!.cellInstance.id,
                placeableInstanceId:null,
                placeableId:placeable.id,
                name:placeable.media.name
            }
            const id = await api.startActivity(ActivityType.Build,target);
            //showInfoPanel2(new CellIPTarget(cellSelected.value!,activityHandler));
        };

        const availableStructures = ref<Placeable[]>([]);

        const showStructurePicker: (value:boolean) => void = (value:boolean)=> {
            //closeInfoPanel();
            picker.value = value;
        }
        
        const addNewBuilding = () => {
            const cellInstance = props.target?.cellInstance;
            availableStructures.value = gameData.cells[cellInstance!.cellId].allowedPlaceableIds.map( id => api.getPlaceable(id));
            
            picker.value = true;
        }

        const openBuilding = (model:WithMedia<PlaceableInstance>) => {
            if(props.target){
                showInfoPanel2(new ExistingPlaceableIPTarget(props.target.cellInstance,model,()=>{
                    console.log('A DONDE VOY, QUE HAGOO')
                }));
            }
        }

        const apiChanged = ref<number>(Date.now());
        const gameData = api.getGameData();

        const handleApiChanges = ()=>{
            console.log('api change detected')
            apiChanged.value = Date.now();
        }

        api.on(GameEvents.Timer, handleApiChanges);

        const builtPlaceables = computed<PlaceableInstanceView[]>( ()=> {
            apiChanged.value;

            return props.target?.cellInstance.placeables.filter( pInstance => pInstance.built == true).map( pInstance => ({
                ...pInstance,
                underConstruction: false,
                media:gameData.placeables[pInstance.placeableId].media
            })) || [];
        });

        const buildActivities = computed<EnqueuedActivityInfoModel[]>( () => {
            apiChanged.value;

            const now = Date.now();
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

        onUnmounted(()=>{

            api.off(GameEvents.Timer,handleApiChanges);
        })

        return {builtPlaceables,buildIcon,addNewBuilding,openBuilding,deleteIcon,buildActivities,picker,availableStructures,showStructurePicker,buildStructure}
    },
})
</script>

<style>

</style>