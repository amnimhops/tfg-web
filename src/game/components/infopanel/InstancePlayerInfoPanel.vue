<template>
    <MessageForm :input="messageFormInput" v-if="messageFormInput" @onClose="sendMessage" />
     <!-- Sección de actividades actualmente en curso -->
    <UIFlex gap="20">
        <UISection title="En cola" class="ml-10" v-if="ongoingActivities.length > 0">
            <UIFlex padding="10" gap="10">
                <EnqueuedActivityInfo v-for="(oa,index) in ongoingActivities" :key="index" :data="oa" />
            </UIFlex>
        </UISection>

        <UIFlex padding="10" gap="10">
            <ActivityButton 
                v-for="(activityInfo,index) in activities" 
                :key="index" 
                :type="activityInfo.type" 
                :target="activityInfo.target" 
                @onStarted="returnHere"
            />
            <!-- El ataque va por su cuenta -->
            <UIButton @onClick="prepareAttack" borderless grow>
                <UIIcon :src="attack.media.icon.url" size="large" />
                <span>{{attack.media.name}}</span>
            </UIButton>
            <!-- Estos dos no son técnicamente actividades...-->
            <UIButton @onClick="composeMessage" borderless grow>
                <UIIcon :src="message.media.icon.url" size="large" />
                <span>{{message.media.name}}</span>
            </UIButton>
            <UIButton borderless grow @onClick="showTradingOptions">
                <UIIcon :src="trade.media.icon.url" size="large" />
                <span>{{trade.media.name}}</span>
            </UIButton>
        </UIFlex>
    </UIFlex>
</template>

<script lang="ts">
import MessageForm from '../game/MessageForm.vue'
import EnqueuedActivityInfo from '../game/EnqueuedActivityInfo.vue'
import ActivityButton from '../game/ActivityButton.vue';
import { AttackIPTarget, InstancePlayerIPTarget, TradeIPTarget } from '@/game/classes/info';
import { GameEvents, useGameAPI } from '@/game/services/gameApi';
import { ActivityType, EnqueuedActivity } from '@/shared/monolyth';
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref } from 'vue'
import * as UI from '../ui';
import { useMessageWriter } from '@/game/classes/messaging';
import { ActivityInfo, AttackActivityTarget, SpyActivityTarget } from '@/game/classes/activities';
import { goBackInfoPanelHistory, showInfoPanel2 } from '@/game/controllers/ui';

export default defineComponent({
    components:{...UI,MessageForm,EnqueuedActivityInfo,ActivityButton},
    props:{
        target:Object as PropType<InstancePlayerIPTarget>
    },
    setup(props) {
        const api = useGameAPI();
        const apiChanged = ref<number>(Date.now());
        const {messageFormInput,openMessageForm,sendMessage} = useMessageWriter();
        const trade = api.getActivity(ActivityType.Trade);
        const message = api.getActivity(ActivityType.Message);
        const attack = api.getActivity(ActivityType.Attack);

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
            
        const composeMessage = () => {
            openMessageForm(props.target!.player.playerId!,'','');
        }

        const returnHere = () => goBackInfoPanelHistory();

        const activities = computed<ActivityInfo[]>(()=>{
            apiChanged.value;

            const opponentId = props.target!.player.playerId!;
            const name = props.target!.media!.name;
            const spyTarget:any= {instancePlayerId:opponentId,name};
            
            return [
                {type:ActivityType.Spy,target:spyTarget as SpyActivityTarget},
            ]
        });

        const prepareAttack = ()=>{
            showInfoPanel2(new AttackIPTarget(props.target!.player));
        }

        const showTradingOptions = ()=>{
            showInfoPanel2(new TradeIPTarget(props.target!.player));
        }
        onMounted(()=>{
            api.on(GameEvents.Timer,apiHandler);
        })
        onUnmounted(()=>{
            api.on(GameEvents.Timer,apiHandler);
        })

        return {
            activities,message,trade,attack,showTradingOptions,
            messageFormInput,composeMessage,sendMessage,
            prepareAttack,ongoingActivities,returnHere
        }
    },
})
</script>

<style>

</style>