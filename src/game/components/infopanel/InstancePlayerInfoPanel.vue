<template>
    <MessageForm :input="messageFormInput" v-if="messageFormInput" @onClose="sendMessage" />
     <!-- Activities -->
    <UISection title="Actividades" class="ml-10">
        <UIFlex padding="10" v-for="(activity,index) in activities" :key="index">
            <UIButton :borderless="true" :rounded="false" grow @onClick="performActivity(activity)" >
                <UIIcon :src="activity.media.icon.url" size="large" />
                <UILabel>{{activity.media.name}}</UILabel>
            </UIButton>
        </UIFlex>
    </UISection>
</template>

<script lang="ts">
import MessageForm from '../game/MessageForm.vue'
import { InstancePlayerIPTarget } from '@/game/classes/info';
import { useGameAPI } from '@/game/services/gameApi';
import { Activity, ActivityType } from 'shared/monolyth';
import { defineComponent, PropType } from 'vue'
import * as UI from '../ui';
import { useMessageWriter } from '@/game/classes/messaging';

export default defineComponent({
    components:{...UI,MessageForm},
    props:{
        target:Object as PropType<InstancePlayerIPTarget>
    },
    setup(props) {
        const api = useGameAPI();
        const {messageFormInput,openMessageForm,sendMessage} = useMessageWriter();
        const attack = api.getActivity(ActivityType.Attack);
        const spy = api.getActivity(ActivityType.Spy);
        const trade = api.getActivity(ActivityType.Trade);
        const message = api.getActivity(ActivityType.Message);
        
        const performActivity = (activity:Activity) => {
            if(activity.type == ActivityType.Message){
                openMessageForm(props.target!.player.playerId!,'');
            }
        };
            
        const activities = [attack,spy,trade,message]
        return {activities,performActivity,messageFormInput,sendMessage}
    },
})
</script>

<style>

</style>