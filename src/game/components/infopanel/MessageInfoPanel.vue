<template>
    <MessageForm :input="messageFormInput" v-if="messageFormInput" @onClose="sendMessage" />
    <UIFlex gap="20" padding="10">
        <UILabel class="large">{{target.message.subject}}</UILabel>
        <UIFlex direction="row" justifyContent="flex-start" gap="5" v-if="target.message.type==MessageType.Message">
            <UILabel>De</UILabel>
            <UILabel link>{{target.remotePlayer.media.name}}</UILabel>
        </UIFlex>
        <UIFlex>
            <p v-for="(paragraph,index) in paragraphs" :key="index">{{paragraph}}</p>
        </UIFlex>
        <UIButton v-if="target.message.type==MessageType.Message" title="Responder" @onClick="reply">
            <UIIcon :src="replyIcon" size="medium"/>
            <UILabel>Responder</UILabel>
        </UIButton>

    </UIFlex>
   
</template>

<script lang="ts">
import MessageForm, { MessageFormInput, MessageFormOutput } from '../game/MessageForm.vue'
import { AssetManager, ConstantAssets } from '@/game/classes/assetManager';
import { MessageIPTarget } from '@/game/classes/info'
import { useGameAPI } from '@/game/services/gameApi'
import { Media,MessageType } from 'shared/monolyth'
import { computed, defineComponent, PropType, ref } from 'vue'

import * as UI from '../ui';
import { useMessageWriter } from '@/game/classes/messaging';
interface BuildingInQueue{
    remaining?:string;
    media:Media;
}

export default defineComponent({
    components:{...UI,MessageForm},
    props:{
        target:Object as PropType<MessageIPTarget>
    },
    setup(props) {
        const api = useGameAPI();
        const {messageFormInput,openMessageForm,sendMessage} = useMessageWriter();
        const replyIcon = AssetManager.get(ConstantAssets.ICON_MSG_MESSAGE).url;
        const paragraphs = computed<string[]>(()=>{
            if(props.target?.message.type == MessageType.Report){
                return [JSON.stringify(props.target.message.message as any).toString()]
            }else{
                return props.target!.message.message.split("\r\n") || []
            }
        });
        const reply = () => {
            openMessageForm(props.target!.message.srcPlayerId!,'Re:'+props.target?.message.subject);
        }
        return {paragraphs,MessageType,replyIcon,reply,messageFormInput,sendMessage}
    },
})
</script>

<style>

</style>