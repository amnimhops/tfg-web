import { Message } from "server/monolyth";
import { closeInfoPanel } from "../controllers/ui";
import { useGameAPI } from "../services/gameApi";
import { MessageFormInput, MessageFormOutput } from "../components/game/MessageForm.vue";
import { ref } from "vue";

export const useMessageWriter = () => {
    const api = useGameAPI();
    const messageFormInput = ref<MessageFormInput|null>();
    
    const openMessageForm = async (dstPlayerId:string,subject?:string,message?:string) => {
        const remotePlayer = await api.getInstancePlayer(dstPlayerId);
        messageFormInput.value = {
            to : remotePlayer.media!.name,
            subject : subject||'',
            playerId : dstPlayerId,
            message : message||''
        }
    }

    const sendMessage = async (output:MessageFormOutput) => {
        console.log(output)
        if(!output.canceled){
            api.sendMessage(output.playerId,output.subject,output.message);

            closeInfoPanel();
        }
        messageFormInput.value = null;
    }

    const closeMessageForm = () => {
        messageFormInput.value = null;
    }

    return {messageFormInput,sendMessage,openMessageForm,closeMessageForm}
}