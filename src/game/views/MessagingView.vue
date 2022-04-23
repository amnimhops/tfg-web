<template>
    <MessageForm :input="messageFormInput" v-if="messageFormInput" />
    <UIPane class="message-view" :style="{ backgroundImage: 'url('+bgImage+')' }">
        <UIFlex padding="10" gap="5" class="options-header">
            <UILabel class="title extra-large mt-10 mb-10">{{section.title}}</UILabel>
            <UIFlex direction="row" justifyContent="space-between">
                <UIButton v-for="(sect,index) in sections" :key="index" :rounded="false" @onClick="changeSection(sect)" :class="{selected:(section.type==sect.type)}">
                    <UIIcon :src="sect.icon" size="medium" />
                    <UILabel class="category-label medium">{{sect.title}}</UILabel>
                </UIButton>
            </UIFlex>
        </UIFlex>
        <UIFlex class="messages" v-if="messages" padding="10" gap="15">
            <UIFlex class="message" v-for="(message,index) in messages" :key="index">
                <span class="xs-12 hidden-xl-up label">De</span>
                <UILabel class="xs-12 xl-3 from" link @onClick="onPlayerSelected(message.srcPlayerId)">{{message.from}}</UILabel>
                <span class="xs-12 hidden-xl-up label">Fecha</span>
                <span class="xs-12 xl-1 date">{{new Date(message.sendAt).toLocaleDateString()}}</span>
                <span class="xs-12 hidden-xl-up label">Asunto</span>
                <span class="xs-12 xl-6 subject">{{truncate(message.subject,64)}}</span>
                <UIFlex direction="row" justifyContent="flex-end" class="xs-12 xl-2 mt-5" gap="5">
                    <UIButton @onClick="openMessage(message)"><UIIcon :src="section.icon"/>Abrir</UIButton>
                    <UIButton @onClick="deleteMessage(message)"><UIIcon :src="deleteIcon"/>Eliminar</UIButton>
                </UIFlex>
            </UIFlex>
            <UIFlex direction="row" justifyContent="space-around">
                <UIPager :page="page" :pages="pageCount" @onChange="changePage"/>
            </UIFlex>
        </UIFlex>        
    </UIPane>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, watch } from 'vue'
import { AssetManager, ConstantAssets } from '../classes/assetManager';
import * as UI from '../components/ui';
import { showErrorPanel, showInfoPanel2 } from '../controllers/ui';
import { useGameAPI } from '../services/gameApi';
import { Message, MessageType } from 'shared/monolyth';
import { deleteIcon } from '../components/ui/icons'
import {truncate} from 'shared/functions'
import { InstancePlayerIPTarget, IPActionCallback, MessageIPTarget } from '../classes/info';
import MessageForm, { MessageFormInput, MessageStatus } from '../components/game/MessageForm.vue'
interface MessagingSection{
    title:string;
    icon:string;
    type:MessageType
}

export default defineComponent({
    components:{...UI,MessageForm},
    setup() {
        
        const api = useGameAPI();
        const messagesReceived = ref<number>(Date.now());
        const iconMessage = AssetManager.get(ConstantAssets.ICON_MSG_MESSAGE).url
        const iconNotification = AssetManager.get(ConstantAssets.ICON_MSG_NOTIFICATION).url
        const iconReport = AssetManager.get(ConstantAssets.ICON_MSG_REPORT).url
        const bgImage = AssetManager.get(ConstantAssets.MESSAGING_BACKGROUND).url;
        const query = ref<string>('');
        const page = ref<number>(0);
        const type = ref<MessageType>(MessageType.Message);
        const messages = ref<Message[]>([]);
        const pageCount = ref<number>();
        const apiChanged = ref<number>(Date.now());
        const messageFormInput = ref<MessageFormInput|undefined>();

        const sections:MessagingSection[] = [
            {title:'Mensajes de jugadores',icon:iconMessage,type:MessageType.Message},
            {title:'Notificaciones',icon:iconNotification,type:MessageType.Notification},
            {title:'Informes',icon:iconReport,type:MessageType.Report},
        ]

        const section = ref<MessagingSection>(sections[0]);

        const activityHandler:IPActionCallback = (action:string,message:Message) =>{
            if(action == MessageIPTarget.ACTION_REPLY){
                replyMessage(message);
            }
        }
        const changePage = (pageIndex:number)=>{
            page.value = pageIndex;
            console.log(pageIndex);
        }
        const changeSection = (newSection:MessagingSection) => {
            section.value = newSection;
        }
        
        const findMessages = (query:string,page:number,section:MessagingSection) => {
            console.log('Buscando mensajes en la api',query,section,page)
            api.getMessages(query,section.type,page)
                .then( (result) => {
                    messages.value = result.results;
                    pageCount.value = result.pages;
                    console.log(messages.value)
                })
                .catch( (err) => {
                    showErrorPanel(err);
                });
        }
        
        const onPlayerSelected = async (id:string) => {
            // Al contrario que en WorldMapView, aquí solo tenemos
            // el ID del jugador, habrá que recuperar sus datos vía
            // API
            const playerDetails = await api.getInstancePlayer(id);
            showInfoPanel2(new InstancePlayerIPTarget(playerDetails,()=>{
                console.log('wwiiii');
            }));
        }

        const openMessage = async (message:Message) => {
            const remotePlayer = await api.getInstancePlayer(message.srcPlayerId!);
            showInfoPanel2(new MessageIPTarget(message,remotePlayer,activityHandler));
        }

        const deleteMessage = async (message:Message) => {
            console.log('borrando')
            messages.value;
            await api.deleteMessage(message.id!);
            findMessages(query.value,page.value,section.value);
        }

        const replyMessage = async (message:Message) => {
            const player = api.getCurrentPlayer();
            const remotePlayer = await api.getInstancePlayer(message.srcPlayerId!);
            messageFormInput.value = {
                to : remotePlayer.media!.name,
                subject : 'Re:'+message.subject,
                message : ''
            }
        }

        const newMessage = (playerId:string) => {
            console.log('wii');
        }

        const onMessageClosed = (status:MessageStatus) => {
            console.log('wii');
        }

        watch([query,page,section], ([nextQuery,nextPage,nextSection],[prevQuery,prevPage,prevSection])=>{
            findMessages(query.value,page.value,section.value);
        });

        onMounted( () => {
            page.value = 1;
        })
        return {
            query,page,section,sections,messages,pageCount,
            bgImage,deleteIcon,
            changePage,changeSection,truncate,onPlayerSelected,openMessage,deleteMessage,
            messageFormInput,replyMessage,newMessage
        }
    }
})
</script>

<style lang="scss" scoped>

    .message-view{
        margin-top:105px;
        height:calc(100vh - 105px); // Para compensar el margen superior que hace que se escondan elementos
        overflow-y: auto;
        background-size: cover;
    }
    .category-label{
        @include invisible;
    }
    .options-header{
        position:sticky;
        top:-70px;
        //background-color:$ui-control-background-color;
    }
    .options-header .ui-button{
        flex-grow:1;
        justify-content: center;
    }
    .message{
        flex-wrap: wrap;
        justify-content: space-between;
        gap:5px;
        padding-bottom:15px;
        border-bottom:2px solid $ui-control-border-color;
        .label{ font-weight: bold; }
        .from,.date,.subject{ padding-left:15px; padding-bottom:15px}
    }
    .ui-button.selected{
        background-color:$ui-control-background-secondary;
    }
    
@media(min-width:1200px){
    .message{
        flex-direction: row;
        align-items: center;
        gap:0;
        .from,.date,.subject{ margin:0;}
        .from{
            font-weight:bold;
        }
    }
    .title{
        @include invisible;
    }
    .category-label{
        @include visible(block);
        font-weight: bold;
    }
    .options-header{
        // Hay que corregir el top porque ya no está visible el título
        top:-10px;
    }
    
}
</style>