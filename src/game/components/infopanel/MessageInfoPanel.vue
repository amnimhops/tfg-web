<template>
    <MessageForm :input="messageFormInput" v-if="messageFormInput" @onClose="sendMessage" />
    <UIFlex gap="20" padding="10">
        <UILabel class="large">{{target.message.subject}}</UILabel>
        <UIFlex direction="row" justifyContent="flex-start" gap="5" v-if="target.message.type==MessageType.Message">
            <UILabel>De</UILabel>
            <UILabel link>{{target.message.senderName}}</UILabel>
        </UIFlex>
        <UIFlex>
            <p v-if="target.message.contentType==MessageContentType.Plain">{{target.message.message}}</p>
            <SpyReport v-if="target.message.contentType==MessageContentType.SpyReport" :report="target.message.message" />
            <TradeReport v-if="target.message.contentType==MessageContentType.TradeReport" :report="target.message.message" />
            <AttackReport v-if="target.message.contentType==MessageContentType.AttackReport" :report="target.message.message" />
            <!--<AtackReport v-if="target.message.contentType==MessageContentType.AtackReport" :report="target.message.message" />
            -->
        </UIFlex>
        <UIButton v-if="target.message.type==MessageType.Message" title="Responder" @onClick="reply">
            <UIIcon :src="replyIcon" size="medium"/>
            <UILabel>Responder</UILabel>
        </UIButton>

    </UIFlex>
   
</template>

<script lang="ts">
import MessageForm, { MessageFormInput, MessageFormOutput } from '../game/MessageForm.vue'
import SpyReport from './SpyReport.vue';
import TradeReport from './TradeReport.vue';
import AttackReport from './AttackReport.vue';
import { AssetManager, ConstantAssets } from '@/game/classes/assetManager';
import { MessageIPTarget } from '@/game/classes/info'
import { useGameAPI } from '@/game/services/gameApi'
import { Media,MessageType,MessageContentType } from '@/shared/monolyth'
import { computed, defineComponent, PropType, ref } from 'vue'

import * as UI from '../ui';
import { useMessageWriter } from '@/game/classes/messaging';


export default defineComponent({
    components:{...UI,MessageForm,SpyReport,TradeReport,AttackReport},
    props:{
        target:Object as PropType<MessageIPTarget>
    },
    setup(props) {
        const api = useGameAPI();
        const {messageFormInput,openMessageForm,sendMessage} = useMessageWriter();
        const replyIcon = AssetManager.get(ConstantAssets.ICON_MSG_MESSAGE).url;

        const reply = () => {
            openMessageForm(props.target!.message.srcPlayerId!,'Re:'+props.target?.message.subject);
        }
        return {
            MessageType,
            MessageContentType,
            replyIcon,reply,messageFormInput,sendMessage
        }
    },
})
</script>

<style>

</style>