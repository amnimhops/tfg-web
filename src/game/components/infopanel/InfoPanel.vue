<template>
<UIPane>
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
        <!--Structure dropdown-->
      <UIFlex v-if="dropdownData.length > 0" padding="10">
        <UIDropdown :data="dropdownData" @change="select" :index="selectedIndex" v-if="dropdownData.length > 1">
          <template v-slot="item">
            <UIFlex direction="row" align-items="center" gap="15" padding="10">
              <!--<UIIcon :src="item.icon" size="large" />-->
              <img :src="item.image" style="width:50px;height:50px;" />
              <UILabel>{{item.title}}</UILabel>
            </UIFlex>
          </template>
        </UIDropdown>
      </UIFlex>
      <!--Breadcrumb / Global taxonomy-->
      <UIFlex direction="row" gap="10" padding="10" v-if="selection.path!=null">
        <template v-for="(link,index) in selection.path" :key="index">
          <UILabel @onClick="navigateTo(link.href)" :link="index < selection.path.length-1">{{link.label}}</UILabel>
          <span v-if="index<selection.path.length-1"> / </span>
        </template>
      </UIFlex>
      <!--Description-->
      <UIFlex padding="10">
      <p>{{selection.media.description}}</p>
      </UIFlex>
      <!--Resource flows-->
      <UIFlex padding="10" gap="10">
        <ResourceFlow v-for="(flow,index) in selection.flows" :key="index" :flow="flow"/>
      </UIFlex>
      <!--Activities-->
      <UIFlex padding="10" direction="column" align-items="flex-end" justify-content="space-between" gap="10" v-if="selection.activities">
        <UIButton v-for="(activity,index) in selection.activities" :key="index" @onClick="performActivity(activity.activity)" :grow="true" justify="flex-start" :disabled="!activity.enabled">
          <UIIcon :src="activity.activity.media.icon.url" size="large"/>
          <UILabel>{{activity.activity.media.name}}</UILabel>
        </UIButton>
      </UIFlex>
    </UIFlex>
</UIPane>

</template>

<script lang="ts">

import UIPane from '../ui/UIPane.vue'
import UIIcon from '../ui/UIIcon.vue'
import UIFlex from '../ui/UIFlex.vue'
import UIButton from '../ui/UIButton.vue'
import UILabel from '../ui/UILabel.vue'
import UIDropdown from '../ui/UIDropdown.vue'
import ResourceFlow from '../game/ResourceFlow.vue'
import {closeIcon} from '@/game/components/ui/icons';
import { defineComponent } from 'vue'
import { useStore } from '@/store';
import { CellIPTarget, InfopanelTarget } from '@/game/classes/info'
import {Activity} from 'shared/monolyth';
const store = useStore();

interface InfoPanelDropdownItem{
    image:string;
    title:string;
}

export default defineComponent({
  components:{
    UIPane,UIIcon,UIFlex,UIButton,UILabel,UIDropdown,ResourceFlow
  },
  props:["panelTarget"],
  data(){
    return{
      closeIcon,
      selectedIndex:0,
      selectedTarget:null,
      selectedActivities:null,
    }
  },
  methods:{
    select(index:number){
      this.selectedIndex = index;
      this.selectedTarget = this.panelTarget[index];
      this.selectedActivities = (this.selectedTarget! as any).activities[0];
      console.log(this.selectedActivities)
    },
    close(){
      store.commit('panelSelection',[])
    },
    navigateTo(){
      console.log('nothign')
    },
    performActivity(activity:Activity){
      this.panelTarget[this.selectedIndex].callback(
        activity,
        this.panelTarget[this.selectedIndex],
      );
    }
  },
  unmounted(){
    console.log('dismounted');
  },
  computed:{
    dropdownData(){
      console.log("dro");
      this.select(0);
      const targets =  (this.panelTarget as InfopanelTarget[]).map( item => ({image:item.media?.image.url||'',title:item.media?.name||''}))
      console.log(targets,'dro');
      return targets;
    },
    selection():InfopanelTarget{
      const ip = this.panelTarget as InfopanelTarget[];
      if(ip.length <= this.selectedIndex){
        this.select(0); // Esto ocurre cuando se viene de visualizar un elemento con más subelementos que el actual
      }
      console.log(this.selectedTarget);
      const fu= this.panelTarget[this.selectedIndex];
      return fu;
    },
  },
  watch:{
    'selectedTarget':{
      handler(newValue,oldValue){
        console.log("ofu",newValue,oldValue);
        console.log((newValue).activities[0].enabled,(this.selectedTarget as any).activities[0].enabled);
      },
      deep:true
    }
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