<template>
    <ActivityConfirmation 
        v-if="activityConfirmationModel" 
        :model="activityConfirmationModel" 
        @onCancel="closeActivityConfirmationDialog" 
        @onAccept="startActivity"
    />
    <!--Resource flows-->
    <UISection title="Genera" class="ml-10" v-if="incomes.length">
        <UIFlex padding="10" gap="10">
            <ResourceFlowItem v-for="(flow,index) in incomes" :key="index" :flow="flow" type="income"/>
        </UIFlex>
    </UISection>
    <UISection title="Consume" class="ml-10" v-if="expenses.length">
        <UIFlex padding="10" gap="10">
            <ResourceFlowItem v-for="(flow,index) in expenses" :key="index" :flow="flow" type="expense"/>
        </UIFlex>
    </UISection>
    <!-- Sección de actividades actualmente en cola -->
    <UISection title="En cola" class="ml-10" v-if="ongoingDismantling">
        <UIFlex padding="10" gap="10">
            <EnqueuedActivityInfo :data="ongoingDismantling" />
        </UIFlex>
    </UISection>
    
    <UISection title="Actividades" class="ml-10" v-if="!ongoingDismantling">
        <UIFlex gap="10" padding="10">
            <ActivityButton 
                v-for="(activityInfo,index) in activities" 
                :key="index" 
                :type="activityInfo.type" 
                :target="activityInfo.target" 
                @onStarted="goBackInfoPanelHistory"/>
        </UIFlex>
    </UISection>
</template>

<script lang="ts">
import ResourceFlowItem from '../game/ResourceFlowItem.vue';
import ActivityConfirmation from '../game/ActivityConfirmation.vue';
import EnqueuedActivityInfo from '../game/EnqueuedActivityInfo.vue';
import ActivityButton from '../game/ActivityButton.vue';
import UISection from '../ui/UISection.vue';
import UIFlex from '../ui/UIFlex.vue';
import { ExistingPlaceableIPTarget } from '@/game/classes/info'
import { GameEvents, useGameAPI } from '@/game/services/gameApi'
import { ActivityType, EnqueuedActivity, ResourceFlow } from 'server/monolyth';
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref } from 'vue'
//import { ActivityInfo, DismantlingActivityTarget, useActivityConfirmation} from 'server/activities'
import { closeInfoPanel, goBackInfoPanelHistory } from '@/game/controllers/ui';
import { ActivityInfo, DismantlingActivityTarget } from 'server/activities';


export default defineComponent({
    props:{
        target: Object as PropType<ExistingPlaceableIPTarget>
    },
    components:{ResourceFlowItem,UISection,UIFlex,ActivityButton,ActivityConfirmation,EnqueuedActivityInfo},
    setup(props) {
        const api = useGameAPI();
        const apiChanged = ref<number>(Date.now());
        const gameData = api.getGameData();
        // const {activityConfirmationModel,openActivityConfirmationDialog,closeActivityConfirmationDialog,startActivity} = useActivityConfirmation();
        // // Puedes quitar el dismantle y todo lo relacionado con ActivityConfirmation, ya no se usa
        // const dismantle = () => {
        //     openActivityConfirmationDialog('Comenzar investigación',ActivityType.Dismantle,{
        //         cellInstanceId:props.target?.cellInstance.id,
        //         placeableInstanceId:props.target?.placeableInstance.id,
        //         name:props.target?.media?.name
        //     } as DismantlingActivityTarget);
        // }

        const activities = computed<ActivityInfo[]>( ()=>{
            apiChanged.value;
            
            const dismantleTarget:DismantlingActivityTarget = {
                cellInstanceId:props.target!.cellInstance.id,
                placeableInstanceId:props.target!.placeableInstance.id,
                name:'Desmantelar '+props.target!.media!.name
            };

            // TODO Añadir el resto de actividades (si hubiera)
            return [
                {type:ActivityType.Dismantle,target:dismantleTarget/*,callback:dismantle*/}
            ];
        });

        const apiTimerHandler = ()=>{
            apiChanged.value = Date.now();
        }
        const onActivityFinished = (enqueuedActivity:EnqueuedActivity) => {
            if(enqueuedActivity.type == ActivityType.Dismantle){
                const target = enqueuedActivity.target as DismantlingActivityTarget;
                if(target.cellInstanceId == props.target?.cellInstance.id && target.placeableInstanceId == props.target.placeableInstance.id){
                    // Esta actividad se corresponde con esta celda, cerramos el panel pues ya no
                    // existe el emplazable asociado.
                    closeInfoPanel();
                }
            }
        }
        // Obtiene reactivamente la lista de actividades asociadas en curso
        const ongoingDismantling = computed<EnqueuedActivity|undefined>( () => {
            apiChanged.value;

            // 1.- Desmantelamiento
            const cellInstance = props.target!.cellInstance;
            return api
                .getQueueByType(ActivityType.Dismantle)
                .find( ea => {
                    const target = ea.target as DismantlingActivityTarget;
                    return target.cellInstanceId == cellInstance.id && target.placeableInstanceId == props.target!.placeableInstance.id
                });
        });
            
        const incomes = computed<ResourceFlow[]>( () => {
            const f = props.target?.placeableInstance.instanceFlows.filter( flow => flow.amount > 0) || [];
            return f;
        });
        const expenses = computed<ResourceFlow[]>( () => {            
            return props.target?.placeableInstance.instanceFlows.filter( flow => flow.amount < 0) || [];
        });
       
        onMounted(()=>{
            // Temporizador de la api, para detectar variaciones en las actividades en curso
            api.on(GameEvents.Timer,apiTimerHandler);
            // Evento de finalización de actividad, para cerrar el panel si se completa 
            // el desmantelamiento.
            api.on(GameEvents.ActivityFinished,onActivityFinished);
        })
        onUnmounted(()=>{
            api.off(GameEvents.Timer,apiTimerHandler);
        })
        
        return {
            incomes,
            expenses,
            activities,
            ongoingDismantling,
            goBackInfoPanelHistory
        }
    },
})
</script>
