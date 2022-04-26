<template>
  <!--Resource flows-->
    <UISection title="Recursos generados" class="ml-10">
        <UIFlex padding="10" gap="10">
            <ResourceFlowItem v-for="(flow,index) in incomes" :key="index" :flow="flow"/>
        </UIFlex>
    </UISection>
    <UISection title="Recursos consumidos" class="ml-10">
        <UIFlex padding="10" gap="10">
            <ResourceFlowItem v-for="(flow,index) in expenses" :key="index" :flow="flow"/>
        </UIFlex>
    </UISection>
    <UISection title="Actividades" class="ml-10">
        <UIFlex padding="10" gap="10">
            <ActivityButton 
                v-for="(activityInfo,index) in activities" 
                :key="index" 
                :type="activityInfo.type" 
                :target="activityInfo.target" 
                @onClick="activityInfo.callback(activityInfo)"/>
        </UIFlex>
    </UISection>
</template>

<script lang="ts">
import ResourceFlowItem from '../game/ResourceFlowItem.vue';
import UISection from '../ui/UISection.vue';
import UIFlex from '../ui/UIFlex.vue';
import { ExistingPlaceableIPTarget } from '@/game/classes/info'
import { useGameAPI } from '@/game/services/gameApi'
import { ActivityTarget, ActivityType, ResourceFlow } from 'shared/monolyth';
import { computed, defineComponent, PropType } from 'vue'
import { AssetManager, ConstantAssets } from '@/game/classes/assetManager';
import { ActivityInfo, DismantlingActivityTarget} from '../../classes/activities'
import ActivityButton from '../game/ActivityButton.vue';

export default defineComponent({
    props:{
        target: Object as PropType<ExistingPlaceableIPTarget>
    },
    components:{ResourceFlowItem,UISection,UIFlex,ActivityButton},
    setup(props) {
        const iconDismantle = AssetManager.get(ConstantAssets.ICON_DISMANTLE).url;
        const api = useGameAPI();
        
        const dismantle = (info:ActivityInfo) => {
            /*try{
                closeResearchConfirmDialog();

                const researchTarget:ResearchActivityTarget = {
                    tech:props.target!.tech,
                    name:props.target!.tech.media.name
                };
                await api.startActivity(ActivityType.Research,researchTarget);
            }catch(err){
                console.error(err);
                error.value = err as string;
            }*/
            console.log('fus')
        }

        const activities = computed<ActivityInfo[]>( ()=>{
            const dismantleTarget:DismantlingActivityTarget = {
                cellInstanceId:props.target!.cellInstance.id,
                placeableInstanceId:props.target!.placeableInstance.id,
                name:'Desmantelar '+props.target!.media!.name
            };

            // TODO Añadir el resto de actividades (si hubiera)
            return [
                {type:ActivityType.Dismantle,target:dismantleTarget,callback:dismantle}
            ];
        });
       
        const incomes = computed<ResourceFlow[]>( () => {
            const f = props.target?.placeableInstance.instanceFlows.filter( flow => flow.amount > 0) || [];
            return f;
        });
        const expenses = computed<ResourceFlow[]>( () => {            
            return props.target?.placeableInstance.instanceFlows.filter( flow => flow.amount < 0) || [];
        });
        
        return {
            incomes,
            expenses,
            activities
        }
    },
})
</script>
