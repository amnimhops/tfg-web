<template>
<UIPane v-if="selection">
  <UIFlex alignItems="space-between" class="info-content">
    <UIFlex gap="5" v-if="selection!=null" class="pane-content">
      <!--Title-->
      <UIFlex direction="row" gap="10" padding="10" alignItems="center">
          <UIButton description="Cerrar el panel" @onClick="close" borderless>
            <UIIcon :src="closeIcon" size="medium"/>
          </UIButton>
          <span class="ui-heading">{{selection.media.name}}</span>
      </UIFlex>
      <!--Large image-->
      <img :src="selection.media.image.url" style="max-width:100%;"/>
      
      <!--Breadcrumb / Global taxonomy-->
      <InfoPanelBreadcrumb :links="selection.path" />
      
      <!--Description-->
      <UIFlex padding="10" v-if="selection.media.description"><p>{{selection.media.description}}</p></UIFlex>
      
      <!-- Specific panel -->      
      <!--{{selection}}-->
      <CellInfoPanel v-if="selection.type==InfoPanelType.CellPane" :target="selection"/>
      <PlaceableInfoPanel v-if="selection.type==InfoPanelType.PlaceablePane" :target="selection"/>
      <PlaceableInstanceInfoPanel v-if="selection.type==InfoPanelType.PlaceableInstancePane" :target="selection"/>
      <TechInfoPanel v-if="selection.type==InfoPanelType.TechnologyPane" :target="selection"/>
      <InstancePlayerInfoPanel v-if="selection.type==InfoPanelType.PlayerPane" :target="selection"/>
      <MessageInfoPanel v-if="selection.type==InfoPanelType.MessagePane" :target="selection"/>
      <BuildListInfoPanel v-if="selection.type==InfoPanelType.PickBuildingPane" :target="selection"/>
      <ActivityInfoPanel v-if="selection.type==InfoPanelType.ActivityPane" :target="selection" />
      <TradeOptionsInfoPanel v-if="selection.type==InfoPanelType.TradeOptionsPane" :target="selection" />
      <AttackOptionsInfoPanel v-if="selection.type==InfoPanelType.AttackOptionsPane" :target="selection" />
      <!-- -->
    </UIFlex>
    <!--<UIFlex direction="row" justifyContent="flex-start" class="mt-10" v-if="showPrevLink" padding="10">
        
      </UIFlex>-->
    <UIButton @onClick="prev" :rounded="false" :borderless="true" justify="center" class="mt-20"><UIIcon :src="leftIcon" size="medium" />Atrás</UIButton>
  </UIFlex>
</UIPane>

</template>

<script lang="ts">

import UIPane from '../ui/UIPane.vue'
import UIIcon from '../ui/UIIcon.vue'
import UIFlex from '../ui/UIFlex.vue'
import UIButton from '../ui/UIButton.vue'
import {closeIcon,leftIcon} from '@/game/components/ui/icons';
import { computed, defineComponent } from 'vue'
import { useStore } from '@/store';
import { InfopanelTarget, InfoPanelType } from '@/game/classes/info'
import { hasPrev, goBackInfoPanelHistory, showInfoPanel2 } from '@/game/controllers/ui'
import InfoPanelBreadcrumb from './InfoPanelBreadcrumb.vue';
import CellInfoPanel from './CellInfoPanel.vue';
import TechInfoPanel from './TechInfoPanel.vue';

import PlaceableInstanceInfoPanel from './PlaceableInstanceInfoPanel.vue';
import PlaceableInfoPanel from './PlaceableInfoPanel.vue';
import InstancePlayerInfoPanel from './InstancePlayerInfoPanel.vue';
import MessageInfoPanel from './MessageInfoPanel.vue';
import BuildListInfoPanel from './BuildListInfoPanel.vue'
import ActivityInfoPanel from './ActivityInfoPanel.vue'
import TradeOptionsInfoPanel from './TradeOptionsInfoPanel.vue'
import AttackOptionsInfoPanel from './AttackOptionsInfoPanel.vue'
const store = useStore();

export default defineComponent({
  components:{
    UIPane,UIIcon,UIFlex,UIButton,
    InfoPanelBreadcrumb,CellInfoPanel,
    PlaceableInfoPanel,PlaceableInstanceInfoPanel,TechInfoPanel,
    InstancePlayerInfoPanel,
    MessageInfoPanel,
    BuildListInfoPanel,
    ActivityInfoPanel,
    TradeOptionsInfoPanel,
    AttackOptionsInfoPanel
  },
  
  setup(){

    const selection = computed<InfopanelTarget|null>( () =>{
      return store.state.target;
    });

    const close = () => {
      showInfoPanel2(null);
    }
    const prev = () => goBackInfoPanelHistory();
    const showPrevLink = computed<boolean> ( () => hasPrev());
   
    const selectionType = computed<string>( () => {
      if(store.state.target != null){
        return (store.state.target as any).constructor.name;
      }else{
        return null;
      }
    });
    
    return {
      selectionType,
      selection,
      closeIcon,leftIcon,
      close,prev,showPrevLink,
      InfoPanelType  
    };
  }
});
</script>

<style lang="scss" scoped>
   .ui-pane{
      position:absolute;
      top:0;
      z-index:998; // Siempre encima
      width:100%;
      right:0px;
      height:100vh;
      overflow-x: hidden;
      overflow-y:auto; // Importante que sea auto, o SIEMPRE se queda la barra, ocultando la imagen!
      scrollbar-width: 5px;
      scrollbar-color: var(--ui-control-border-color);
   }    
   .info-content{
     height:100%;
   }
   .pane-content{
     flex-grow:1;
   }
   @media(min-width:768px){
     .ui-pane{
       width:400px;
       box-shadow: -5px 0px 5px var(--ui-control-shadow-color);
     }
   }

  p{
    text-align: justify;
    margin-top:0px;
  }
</style>