<template>
  <UIModal title="Nuevo mensaje" @onClose="emit('onClose')">
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
      <UIFlex direction="row" justify-content="flex-start" align-items="center" gap="15">
        <UIButton :disabled="disabled" @onClick="emit('onSelect',selectedItem)"><UIIcon :src="acceptIcon" size="medium" /><span>Seleccionar</span></UIButton>
      </UIFlex>
    </template>
  </UIModal>
</template>

<script lang="ts">

import * as UI from '@/game/components/ui/';
import {acceptIcon} from '@/game/components/ui/icons'
import { useGameAPI } from '@/game/services/gameApi'
import { Message } from 'shared/monolyth';
import {computed, defineComponent, PropType, ref} from 'vue';

export interface MessageStatus{
    canceled:boolean;
    subject:string;
    message:string;
}

export interface MessageFormInput{
  to:string;
  subject:string;
  message:string
}
export default defineComponent({
  components:{...UI},
  emits:['onClose','onSelect','update:modelValue'],
  props:{
    input: Object as PropType<MessageFormInput>,
  },
  setup(props,{emit}) {
    const api = useGameAPI();
    const output = ref<MessageStatus>({
      canceled:false,
      subject:props.input?.subject || '',
      message:props.input?.message || ''
    })

    return {acceptIcon,output, emit}
  }
});
</script>

<style lang="scss" scoped>
  .message-form{
    min-height:400px;
  }
  .form-control{
    flex-direction: column;
    gap:10px;
  }
  
</style>