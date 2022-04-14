<template>
    <!-- Buildings -->
    <UISection title="Construcciones" class="ml-10">
        <UIFlex padding="10">
            <UIButton v-for="(placeable,index) in placeables" :key="index" :borderless="true" :rounded="false" grow @onClick="openBuilding(placeable)">
                <UIIcon :src="placeable.media.icon.url" size="large" />
                <UILabel>{{placeable.media.name}}</UILabel>
            </UIButton>
            <UILabel v-for="(item,index) in buildingQueue" :key="index">Construyendo {{item.media.name}} en {{item.remaining}}</UILabel>
        </UIFlex>
    </UISection>
    <!-- Activities -->
    <UISection title="Actividades" class="ml-10">
        <UIFlex padding="10">
            <UIButton :borderless="true" :rounded="false" grow @onClick="addNewBuilding">
                <UIIcon :src="buildIcon" size="large" />
                <UILabel>Construir</UILabel>
            </UIButton>
            <UIButton :borderless="true" :rounded="false" grow @onClick="observe">
                <UIIcon :src="buildIcon" size="large" />
                <UILabel>OBSERVAR</UILabel>
            </UIButton>
        </UIFlex>
    </UISection>
</template>

<script lang="ts">
import { CellIPTarget, ExistingPlaceableIPTarget } from '@/game/classes/info'
import { GameEvents, useGameAPI } from '@/game/services/gameApi'
import { ActivityType, Media, Placeable } from 'shared/monolyth'
import { computed, defineComponent, onUnmounted, PropType, ref } from 'vue'
import { showInfoPanel2 } from '@/game/controllers/ui'
import { AssetManager, ConstantAssets } from '@/game/classes/assetManager'
import { BuildingActivityTarget } from '@/game/classes/activities'
import * as UI from '../ui/';
interface BuildingInQueue{
    remaining?:string;
    media:Media;
}

export default defineComponent({
    components:{...UI},
    props:{
        target:Object as PropType<CellIPTarget>
    },
    setup(props) {
        const api = useGameAPI();
        
        const buildIcon = AssetManager.get(ConstantAssets.ICON_BUILD).url;
        
        const addNewBuilding = () => {
            props.target?.actionCallback(CellIPTarget.ACTION_BUILD)
        }

        const openBuilding = (placeable:Placeable) => {
            if(props.target){
                showInfoPanel2(new ExistingPlaceableIPTarget(props.target.cellInstance,placeable.id,()=>{
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

        const buildingQueue = computed<BuildingInQueue[]>( () => {
            apiChanged.value;
            const buildingsInQueue:BuildingInQueue[] = [];
            api.getQueueByType(ActivityType.Build).forEach( activity => {
                const target = activity.target as BuildingActivityTarget;
                if(target.cellInstanceId == props.target?.cellInstance.id){
                    buildingsInQueue.push({
                        remaining:(activity.remaining!/1000).toFixed(1)+" sec.",
                        media:gameData.placeables[target.placeableId].media
                    })
                }
            })

            return buildingsInQueue;
        });

        const placeables = computed<Placeable[]>( ()=> {
            apiChanged.value;
            return props.target?.cellInstance.placeableIds.map( id => gameData.placeables[id]) || [];
        });

        onUnmounted(()=>{

            api.off(GameEvents.Timer,handleApiChanges);
        })

        return {placeables,buildIcon,addNewBuilding,openBuilding,buildingQueue}
    },
})
</script>

<style>

</style>