<template>
  <UIModal title="Nuevo mensaje" @onClose="cancel">
    <template v-slot:content>
      <UIFlex gap="15" class="message-form">
        <UIFlex class="form-control">
          <UILabel>Para:</UILabel>          
          <UILabel>{{input.to}}</UILabel>
        </UIFlex>
        <UIFlex class="form-control">
          <UILabel>Asunto:</UILabel>          
          <input type="text" v-model="output.subject" />
        </UIFlex>
        <UIFlex class="form-control">
          <UILabel>Mensaje</UILabel>          
          <textarea v-model="output.message"></textarea>
        </UIFlex>
      </UIFlex>
    </template>
    <template v-slot:footer>
      <UIFlex direction="row" justify-content="space-between" align-items="center" gap="15">
        <UIButton @onClick="send" :disabled="output.message.length == 0">
          <UIIcon :src="acceptIcon" size="medium" />
          <UILabel >Enviar</UILabel>
        </UIButton>
        <UIButton @onClick="cancel">
          <UIIcon :src="closeIcon" size="medium" />
          <UILabel>Cancelar</UILabel>
        </UIButton>
      </UIFlex>
    </template>
  </UIModal>
</template>

<script lang="ts">

import * as UI from '@/game/components/ui/';
import {acceptIcon,closeIcon} from '@/game/components/ui/icons'
import { useGameAPI } from '@/game/services/gameApi'
import {defineComponent, PropType, ref} from 'vue';

export interface MessageFormOutput{
    canceled:boolean;
    subject:string;
    message:string;
    playerId:string;
}

export interface MessageFormInput{
  to:string;
  subject:string;
  message:string;
  playerId:string;
}
export default defineComponent({
  components:{...UI},
  emits:['onClose'],
  props:{
    input: Object as PropType<MessageFormInput>,
  },
  setup(props,{emit}) {
    const api = useGameAPI();
    const output = ref<MessageFormOutput>({
      canceled:false,
      subject:props.input?.subject || '',
      message:props.input?.message || '',
      playerId:props.input?.playerId || ''
    })

    const cancel = ()=>{
      output.value.canceled = true;
      emit('onClose',output.value)
    }

    const send = ()=>{
      output.value.canceled = false;
      // Ojo, output es un ref<>(), no una variable normal
      emit('onClose',output.value)
    }

    return {acceptIcon,closeIcon,output,send,cancel}
  }
});
</script>

<style lang="scss" scoped>
  .message-form{
    flex-grow:1;
    >.ui-flex:last-child{
      flex-grow:1;
    }
  }
  .form-control{
    flex-direction: column;
    gap:10px;
  }
  textarea{
    flex-grow:1;
  }

  @media(min-width:768px){
    .message-form{
      min-width:600px;
    }
  }
</style>