<template>
<UIPane v-if="selection">
  {{selectionType}}
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
      <!--Executable activities-->
      <UIFlex padding="10" direction="column" align-items="flex-end" justify-content="space-between" gap="10" v-if="availableActivities.length > 0">
        <UIButton v-for="(activity,index) in availableActivities" :key="index" @onClick="performActivity(activity.activity)" :grow="true" justify="flex-start" :disabled="!activity.enabled">
          <UIIcon :src="activity.activity.media.icon.url" size="large"/>
          <UILabel>{{activity.activity.media.name}}</UILabel>
        </UIButton>
      </UIFlex>
      <!--Running activities-->
      <UIFlex padding="10" direction="row" align-items="center" justify-content="space-between" gap="10" v-if="runningActivities.length > 0">
        <!--<UIButton v-for="(activity,index) in runningActivities" :key="index" @onClick="performActivity(activity.activity)" :grow="true" justify="flex-start">
          <UIIcon :src="activity.media.icon.url" size="large"/>
          <UILabel>{{activity.media.name}}</UILabel>
        </UIButton>-->
        <span v-for="(activity,index) in runningActivities" :key="index">
        {{activity.media.name}} queda {{countdowns[activity.activity.id]}}
        </span>
      </UIFlex>
      <UIFlex padding="10" direction="column" align-items="center" justify-content="flex-start" gap="10" v-if="selection.warnings.length > 0">
        <UIFlex v-for="(warning,index) in selection.warnings" :key="index" direction = "row" gap="10">
          <UIIcon :src="warning.icon.url" size="medium"/>
          <UILabel>{{warning.label}}</UILabel>
        </UIFlex>
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
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue'
import { useStore } from '@/store';
import { CellIPTarget, InfoPanelActivity, InfoPanelRunningActivity, InfopanelTarget, InfoPanelWarning } from '@/game/classes/info'
import {Activity} from 'shared/monolyth';
import { showInfoPanel } from '@/game/controllers/ui'
const store = useStore();

interface InfoPanelDropdownItem{
    image:string;
    title:string;
}

export default defineComponent({
  components:{
    UIPane,UIIcon,UIFlex,UIButton,UILabel,UIDropdown,ResourceFlow
  },
  
  setup(){
    
    const countdowns = ref<Record<string,number>>({});
    const lastTimerExecution = ref<number>(0);
    const setupCountdowns = (runningTasks:InfoPanelRunningActivity[]) => {
      countdowns.value = {};
      runningTasks.forEach( task => countdowns.value[task.activity.id] = task.activity.remaining||0 );
    };

    const processCountdowns = ()=>{
      const now = Date.now();
      const elapsed = now - lastTimerExecution.value;
      console.log('descontando, hay',countdowns.value);
      if(countdowns.value){
        for(const id in countdowns.value){
          countdowns.value[id] = Math.max(0,countdowns.value[id]-elapsed) ;
          // Si algún contador llega a cero, recargamos el target de infopanel y vuelta a empezar
          console.log("now,",countdowns.value[id])
          if(countdowns.value[id] == 0){
            setTimeout(()=>showInfoPanel(store.state.panelTargets),0);
          }
        }
      }
      lastTimerExecution.value = now;
    };

    const timer = ref<number|null>(null);

    onMounted(()=>{
      timer.value = setInterval(processCountdowns,1000);
    });

    onUnmounted(()=>{
      console.log('Dismounting infopanel intervals')
      if(timer.value){
        clearInterval(timer.value);
      }
    });

    const selection = computed<InfopanelTarget|null>( () =>{
     
      if(store.state.panelTargets && store.state.panelSelectedIndex != null){
        console.log('now is ',store.state.panelTargets[store.state.panelSelectedIndex])
        return store.state.panelTargets[store.state.panelSelectedIndex];
      }else{
        console.log('fuuu');
        return null;
      }
      
    });
    const dropdownData = computed<InfoPanelDropdownItem[]>( () => {
      const targets = store.state.panelTargets;
      if(targets) {
        return targets.map( target => ({image:target.media?.icon.url||'',title:target.media?.name||''}));
      } else {
        return [];
      }
    });
    const availableActivities = computed<InfoPanelActivity[]>(()=>{
      return selection.value?.getAvailableActivities() || [];
    });
    const runningActivities = computed<InfoPanelRunningActivity[]>(()=>{
      const running = selection.value?.getRunningActivities() || [];
      setupCountdowns(running);
      return running;
    });
    const select = (index:number) => {
      showInfoPanel(store.state.panelTargets,index);
    }
    const selectedIndex = computed<number | null>( () => {
      return store.state.panelSelectedIndex;
    });

    const selectionType = computed<string>( () => {
      if(store.state.panelSelectedIndex != null){
        return (store.state.panelTargets[store.state.panelSelectedIndex] as any).constructor.name;
      }else{
        return null;
      }
    });

    const performActivity = (activity:Activity)=>{
      if(selection.value){
        selection.value.callback(activity,selection.value);
      }
    }

    return {
      selectedIndex,
      select,
      selectionType,
      dropdownData,
      selection,
      closeIcon,
      performActivity,
      availableActivities,
      runningActivities,
      countdowns
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