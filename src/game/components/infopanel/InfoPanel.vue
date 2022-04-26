<template>
<UIPane v-if="selection">
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
      <CellInfoPanel v-if="selectionType=='CellIPTarget'" :target="selection"/>
      <PlaceableInfoPanel v-if="selectionType=='ExistingPlaceableIPTarget'" :target="selection"/>
      <TechInfoPanel v-if="selectionType=='TechIPTarget'" :target="selection"/>
      <InstancePlayerInfoPanel v-if="selectionType=='InstancePlayerIPTarget'" :target="selection"/>
      <MessageInfoPanel v-if="selectionType=='MessageIPTarget'" :target="selection"/>
      <!-- -->

    </UIFlex>
</UIPane>

</template>

<script lang="ts">

import UIPane from '../ui/UIPane.vue'
import UIIcon from '../ui/UIIcon.vue'
import UIFlex from '../ui/UIFlex.vue'
import UIButton from '../ui/UIButton.vue'
import {closeIcon} from '@/game/components/ui/icons';
import { computed, defineComponent } from 'vue'
import { useStore } from '@/store';
import { InfopanelTarget } from '@/game/classes/info'
import { showInfoPanel2 } from '@/game/controllers/ui'
import InfoPanelBreadcrumb from './InfoPanelBreadcrumb.vue';
import CellInfoPanel from './CellInfoPanel.vue';
import TechInfoPanel from './TechInfoPanel.vue';

import PlaceableInfoPanel from './PlaceableInfoPanel.vue';
import InstancePlayerInfoPanel from './InstancePlayerInfoPanel.vue';
import MessageInfoPanel from './MessageInfoPanel.vue';

const store = useStore();

export default defineComponent({
  components:{
    UIPane,UIIcon,UIFlex,UIButton,
    InfoPanelBreadcrumb,CellInfoPanel,
    PlaceableInfoPanel,TechInfoPanel,
    InstancePlayerInfoPanel,
    MessageInfoPanel
  },
  
  setup(){

    const selection = computed<InfopanelTarget|null>( () =>{
      return store.state.target;
    });

    const close = () => {
      showInfoPanel2(null);
    }

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
      closeIcon,
      close
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
      scrollbar-color: $ui-control-border-color;
   }    
   @media(min-width:768px){
     .ui-pane{
       width:400px;
       box-shadow: -5px 0px 5px $ui-control-shadow-color;
     }
   }

  p{
    text-align: justify;
    margin-top:0px;
  }
</style>