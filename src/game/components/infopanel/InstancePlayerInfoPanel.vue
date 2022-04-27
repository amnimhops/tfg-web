<template>
    <MessageForm :input="messageFormInput" v-if="messageFormInput" @onClose="sendMessage" />
    <ActivityConfirmation 
        v-if="activityConfirmationModel" 
        :model="activityConfirmationModel" 
        @onCancel="closeActivityConfirmationDialog" 
        @onAccept="startActivity"
    />
     <!-- Sección de actividades actualmente en curso -->
    <UISection title="En cola" class="ml-10" v-if="ongoingActivities.length > 0">
        <UIFlex padding="10" gap="10">
            <EnqueuedActivityInfo v-for="(oa,index) in ongoingActivities" :key="index" :data="oa" />
        </UIFlex>
    </UISection>
    <UISection title="Actividades" class="ml-10">
        <UIFlex padding="10" gap="10">
            <ActivityButton 
                v-for="(activityInfo,index) in activities" 
                :key="index" 
                :type="activityInfo.type" 
                :target="activityInfo.target" 
                @onClick="activityInfoCallback(activityInfo)"/>
        </UIFlex>
    </UISection>

</template>

<script lang="ts">
import MessageForm from '../game/MessageForm.vue'
import EnqueuedActivityInfo from '../game/EnqueuedActivityInfo.vue'
import ActivityButton from '../game/ActivityButton.vue';
import ActivityConfirmation from '../game/ActivityConfirmation.vue'
import { InstancePlayerIPTarget } from '@/game/classes/info';
import { GameEvents, useGameAPI } from '@/game/services/gameApi';
import { Activity, ActivityType, EnqueuedActivity } from 'shared/monolyth';
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref } from 'vue'
import * as UI from '../ui';
import { useMessageWriter } from '@/game/classes/messaging';
import { ActivityInfo, AttackActivityTarget, SpyActivityTarget, useActivityConfirmation } from '@/game/classes/activities';

export default defineComponent({
    components:{...UI,MessageForm,ActivityConfirmation,EnqueuedActivityInfo,ActivityButton},
    props:{
        target:Object as PropType<InstancePlayerIPTarget>
    },
    setup(props) {
        const api = useGameAPI();
        const apiChanged = ref<number>(Date.now());
        const {messageFormInput,openMessageForm,sendMessage} = useMessageWriter();
        const {activityConfirmationModel,openActivityConfirmationDialog,closeActivityConfirmationDialog,startActivity} = useActivityConfirmation();
        const attack = api.getActivity(ActivityType.Attack);
        const spy = api.getActivity(ActivityType.Spy);
        const trade = api.getActivity(ActivityType.Trade);
        const message = api.getActivity(ActivityType.Message);
        
        /*const performActivity = (activity:Activity) => {
            if(activity.type == ActivityType.Message){
                openMessageForm(props.target!.player.playerId!,'');
            }else if(activity.type == ActivityType.Spy){
                openActivityConfirmationDialog('Iniciar espionaje',ActivityType.Spy,{
                    instancePlayerId:props.target?.player.playerId
                } as SpyActivityTarget);
            }
        };*/

        const apiHandler = ()=>{
            apiChanged.value = Date.now();
        }

        // Obtiene reactivamente la lista de actividades asociadas en curso
        const ongoingActivities = computed<EnqueuedActivity[]>( () => { 
            apiChanged.value;
            const enqueued:EnqueuedActivity[] = [];
            // 
            enqueued.push(
                ...api.getQueueByType(ActivityType.Spy).filter( ea => (ea.target as SpyActivityTarget).instancePlayerId == props.target!.player.playerId)
            );
            enqueued.push(
                ...api.getQueueByType(ActivityType.Attack).filter( ea => (ea.target as AttackActivityTarget).instancePlayerId == props.target!.player.playerId)
            );
            console.log(enqueued.length,'found');
            return enqueued;
        })
            
        const activityInfoCallback = (activityInfo:ActivityInfo) => {
            openActivityConfirmationDialog('Iniciar actividad',activityInfo.type,activityInfo.target);
        }

        const activities = computed<ActivityInfo[]>(()=>{
            const opponentId = props.target!.player.playerId!;
            const name = props.target!.media!.name;
            const spyTarget:any= {instancePlayerId:opponentId,name};
            
            return [
                {type:ActivityType.Spy,target:spyTarget as SpyActivityTarget},
                {type:ActivityType.Attack,target:spyTarget  as AttackActivityTarget}
            ]
        });

        onMounted(()=>{
            api.on(GameEvents.Timer,apiHandler);
        })
        onUnmounted(()=>{
            api.on(GameEvents.Timer,apiHandler);
        })

        return {
            activities,activityInfoCallback,
            messageFormInput,sendMessage,
            ongoingActivities,
            activityConfirmationModel,closeActivityConfirmationDialog,openActivityConfirmationDialog,startActivity
        }
    },
})
</script>

<style>

</style>