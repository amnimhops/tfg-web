<template>
  <UIModal title="Seleccionar estructura" @onClose="emit('onClose')">
    <template v-slot:content>
      <UIFlex gap="5">
        <!-- Lista -->
        <UIList :items="structures" v-model="selectedItem">
          <template v-slot="item">
            <!-- Edificio -->
            <UIFlex direction="row" gap="10" padding="5" justify-content="flex-start">
              <img class="ui-image" :src="item.media.image.url" />
              <UIFlex gap="20">
                <span class="ui-heading">{{item.media.name}}</span>
                <p>{{item.media.description}}</p>
                <!-- Beneficios y costes -->
                <UIFlex gap="15" direction="row" justifyContent="space-between" :wrap="true">
                  <div class="resource">
                    <span class="title">Produce</span>
                    <UIFlex gap="5" class="mt-5">
                      <ResourceFlow v-for="(flow,index) in item.flows" :key="index" :flow="flow" :packed="true"/>
                    </UIFlex>
                  </div>
                  <div class="resource">
                    <span class="title">Coste</span>
                    <UIFlex gap="5" class="mt-5">
                      <ResourceFlow v-for="(flow,index) in activity.flows" :key="index" :flow="flow" :packed="true"/>
                    </UIFlex>
                  </div>
                </UIFlex>
              </UIFlex>
            </UIFlex>
          </template>
        </UIList>
      </UIFlex>
    </template>
    <template v-slot:footer>
      <UIFlex direction="row" justify-content="space-around" align-items="center">
        <UIButton :disabled="disabled" @onClick="emit('onSelect',selectedItem)"><UIIcon :src="acceptIcon" size="medium" /><span>Seleccionar</span></UIButton>
        <div v-if="disabled">
          <UILabel class="danger" >No tienes recursos suficientes</UILabel>
        </div>
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
import ResourceFlow from '@/game/components/game/ResourceFlow.vue'
import {acceptIcon} from '@/game/components/ui/icons'
import { useGameAPI } from '@/game/services/gameApi'
import { ActivityType, CellInstance, Placeable } from 'shared/monolyth'
import {computed, defineComponent, ref} from 'vue';
import { ActivityAvailability, BuildingActivityTarget } from '@/game/classes/activities'

export default defineComponent({
  components:{UIModal,UIFlex,UIButton,UIIcon,UIList,ResourceFlow,UILabel},
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
          new BuildingActivityTarget((props.cell as CellInstance).id,selectedItem.value.id)
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
/*export default {
  components:{UIModal,UIFlex,UIButton,UIIcon,UIList,ResourceFlow},
  emits:['onClose','onSelect'],
  props:['structures','modelValue'],
  mounted(){
    this.data.api = useGameAPI();
  },
  data(){
    return{
      acceptIcon,
      selectedItem:null,
      api:null
    }
  },
  methods:{
    select(){
      this.$emit("update:modelValue", this.selectedItem);
      this.$emit("onSelect", this.selectedItem);
    }
  },
  computed:{
    activity(){
      return this.api.getActivity(ActivityType.Build);
    }
  }
}*/
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
  .selected{
    background-color:$ui-control-background-primary;
  }
  .resource{
    >.title{
      font-weight:bold;
    }
  }
  
</style>