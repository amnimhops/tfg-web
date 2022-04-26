<template>
  <UIModal title="Error" @onClose="emit('onClose')">
    <template v-slot:content>
      <UIFlex gap="5" class="item-holder">
      <p>{{message}}</p>
      </UIFlex>
    </template>
    <template v-slot:footer>
      <UIFlex direction="row" justify-content="flex-start" align-items="center" gap="15">
        <UIButton @onClick="emit('onClose')"><UIIcon :src="acceptIcon" size="medium" /><span>Entendido</span></UIButton>
      </UIFlex>
    </template>
  </UIModal>
</template>

<script lang="ts">

import {acceptIcon} from '@/game/components/ui/icons'
import { defineComponent } from 'vue';
import * as UI from '../ui/';

export default defineComponent({
  components:{...UI},
  emits:['onClose'],
  props:['message'],
  setup(props,{emit}) {
    
    return {acceptIcon,emit}
  }
});
</script>

<style lang="scss" scoped>
  .building-picker{
    width:400px;
    height:400px;
  }
  p{
    max-width:600px;
    margin:0px;
    padding:0px;
  }
  .ui-image{
    width:25%;
    height:150px;
    object-fit: cover;
    object-position: center;
  }
  .item-holder{
    background-color:$ui-control-background-color;
  }
  .selected{
    background-color:$ui-control-background-primary;
  }
  .title{
      font-weight:bold;
  }
  .large{
    font-weight: bold;
  }
  
</style>