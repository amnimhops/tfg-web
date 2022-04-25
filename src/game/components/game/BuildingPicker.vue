<template>
  <UIModal title="Seleccionar estructura" @onClose="emit('onClose')">
    <template v-slot:content>
      <UIFlex gap="5" class="item-holder">
        <!-- Lista -->
        <UIList :items="structures" v-model="selectedItem">
          <template v-slot="item">
            <!-- Edificio -->
            <UIFlex direction="row" gap="10" padding="5" justify-content="flex-start">
              <img class="ui-image" :src="item.media.image.url" />
              <UIFlex gap="20">
                <span class="large">{{item.media.name}}</span>
                <p>{{item.media.description}}</p>
                <!-- Beneficios y costes -->
                <UIFlex gap="15" direction="column" justifyContent="space-between" :wrap="true">
                  <UILabel class="title" >Producción/Consumo</UILabel>
                  <UIFlex gap="5" class="mt-5">
                    <ResourceFlowItem v-for="(flow,index) in item.flows" :key="index" :flow="flow" :packed="true"/>
                  </UIFlex>
                </UIFlex>
              </UIFlex>
            </UIFlex>
          </template>
        </UIList>
      </UIFlex>
    </template>
    <template v-slot:footer>
      <UIFlex direction="row" justify-content="flex-start" align-items="center" gap="15">
        <UIButton :disabled="disabled" @onClick="emit('onSelect',selectedItem)"><UIIcon :src="acceptIcon" size="medium" /><span>Seleccionar</span></UIButton>
        
        <UIFlex alignItems="flex-start">
          <UILabel class="title">Coste de producción</UILabel>
          <UIFlex direction="row" :wrap="true">
            <ResourceFlowItem v-for="(flow,index) in activity.flows" :key="index" :flow="flow" :packed="true" />
          </UIFlex>
        </UIFlex>
      </UIFlex>
    </template>
  </UIModal>
</template>

<script lang="ts">

import UIModal from '@/game/components/ui/UIModal.vue'
import UIFlex from '@/game/components/ui/UIFlex.vue'
import UIButton from '@/game/components/ui/UIButton.vue'
import UIIcon from '@/game/components/ui/UIIcon.vue'
import UIList from '@/game/components/ui/UIList.vue'
import UILabel from '@/game/components/ui/UILabel.vue'
import ResourceFlowItem from '@/game/components/game/ResourceFlowItem.vue'
import {acceptIcon} from '@/game/components/ui/icons'
import { useGameAPI } from '@/game/services/gameApi'
import { ActivityType, CellInstance, Placeable } from 'shared/monolyth'
import {computed, defineComponent, ref} from 'vue';
import { ActivityAvailability, BuildingActivityTarget } from '@/game/classes/activities'

export default defineComponent({
  components:{UIModal,UIFlex,UIButton,UIIcon,UIList,ResourceFlowItem,UILabel},
  emits:['onClose','onSelect','update:modelValue'],
  props:['structures','cell','modelValue'],
  setup(props,{emit}) {
    const api = useGameAPI();
    const selectedItem = ref<Placeable|null>(null);
    const activity = api.getActivity(ActivityType.Build);
    const reasons = ref<string[]>([]);
    
    const changeReasons = (newReasons:string[]) => {
      reasons.value = newReasons;
    }
    const disabled = computed<boolean>( ():boolean => {
      if(selectedItem.value != null){
        const availability = api.checkActivityAvailability(
          ActivityType.Build,
          {
            cellInstanceId:(props.cell as CellInstance).id,
            placeableId:selectedItem.value.id
          } as BuildingActivityTarget
        );
        if(availability.available){
          return false;
        }else{
          changeReasons(availability.info);
          return true;
        }
      }else{
        return true;
      }
      
    });

    const select: () => void = () => {
      emit("update:modelValue", selectedItem);
    }
    return {acceptIcon,select,selectedItem,activity, disabled, emit, reasons}
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