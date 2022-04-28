<template>
    <UIFlex padding="10" gap="10" v-if="placeables.length==0">
        <UILabel>No hay estructuras disponibles</UILabel>
    </UIFlex>
    <UIFlex v-for="(item,index) in placeables" :key="index" gap="10" padding="10">
        <!--<UIFlex direction="row" gap="10" alignItems="center">
            <UIIcon :src="item.placeable.media.icon.url" size="large"/>
            <UILabel class="large bold" link @onClick="openPlaceable(item.placeable)">{{item.placeable.media.name}}</UILabel>
        </UIFlex>-->
        <UIFlex direction="row" gap="10" alignItems="center">
            <UIIcon :src="item.placeable.media.icon.url" size="large"/>
            <UILabel class="large bold" link @onClick="openPlaceable(item.placeable)">{{item.placeable.media.name}}</UILabel>
        </UIFlex>            
        <UISection>
            <UIFlex class="ml-5">
                <ActivityButton 
                :type="item.type" 
                :target="item.target" 
                @onStarted="goBackToCell"
                />
            </UIFlex>
        </UISection>
    </UIFlex>
</template>

<script lang="ts">
import ResourceFlowItem from '../game/ResourceFlowItem.vue';
import ActivityButton from '../game/ActivityButton.vue';
import {getHistoryTarget, goBackInfoPanelHistory} from '@/game/controllers/ui'
import { PickBuildingIPTarget, PlaceableIPTarget } from '@/game/classes/info'
import { ActivityCost, GameEvents, useGameAPI } from '@/game/services/gameApi'
import { ActivityType, Placeable, ResourceAmount } from 'shared/monolyth';
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref } from 'vue'
import { BuildingActivityTarget} from '../../classes/activities'
import * as UI from '@/game/components/ui/';
import { AssetManager, ConstantAssets } from '@/game/classes/assetManager';
import {timeIcon} from '../ui/icons'
import { showInfoPanel2 } from '@/game/controllers/ui';
interface BuildInfo{
    type:ActivityType;
    target:BuildingActivityTarget;
    cost:ActivityCost;
    placeable:Placeable;
}
export default defineComponent({
    props:{
        target: Object as PropType<PickBuildingIPTarget>
    },
    components:{...UI,ActivityButton},
    setup(props) {
        console.log(props.target!.placeables);
        const api = useGameAPI();
        const apiChanged = ref<number>(Date.now());
        const buildIcon = AssetManager.get(ConstantAssets.ICON_BUILD).url;
        
        const placeables = computed<BuildInfo[]>( ()=>{
            apiChanged.value;
            
            return props.target!.placeables.map( placeable => {
                const target = {
                    cellInstanceId:props.target!.cellInstance.id,
                    placeableId:placeable.id,
                    name:placeable.media.name
                } as BuildingActivityTarget;
                const type = ActivityType.Build;
                const cost = api.getActivityCost(ActivityType.Build,target);

                console.log(cost);

                return {type,target,placeable,cost}
            });
            
        });

        /* Target del paso anterior, para volver cuando finalice la construcción */
        /* El valor de este target se fija a la hora de crear el componente y será fijo */
        const prevTarget = getHistoryTarget(-1);
        const goBackToCell = ()=>{
            showInfoPanel2(prevTarget);
        }
        const openPlaceable = (item:Placeable) => {
            showInfoPanel2(new PlaceableIPTarget(item));
        }

        const apiHandler = ()=>{
            apiChanged.value = Date.now();
        }
       
        onMounted(()=>{
            // Temporizador de la api, para detectar variaciones en las actividades en curso
            api.on(GameEvents.Timer,apiHandler);

        })
        onUnmounted(()=>{
            api.off(GameEvents.Timer,apiHandler);
        })
        
        return {
            buildIcon,timeIcon,
            placeables,openPlaceable,
            goBackToCell
        }
    },
})
</script>
