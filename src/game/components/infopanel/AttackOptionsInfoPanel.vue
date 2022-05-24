<template>
  <UIFlex gap="20" padding="10">
    <UISection title="Coste base">
      <UIFlex gap="10" class="pl-5">
        <UIFlex direction="row" gap="10" alignItems="center">
            <UIIcon :src="timeIcon" size="medium"/>
            <UILabel>Duración {{cost.duration}}</UILabel>
        </UIFlex>
        <ResourceFlowItem v-for="(flow,index) in cost.resources" :key="index" :flow="flow" type="expense"/>
      </UIFlex>
    </UISection>
    <UISection title="Agregar recursos">
      <UIFlex gap="10" class="pl-5">
        <UIDropdown :data="availableResources" @change="resourceChanged">
            <template v-slot:item="item">
              <UIFlex direction="row" padding="10" justifyContent="space-between" alignItems="center" >
              <UIFlex direction="row" gap="10" alignItems="center" >
                <UIIcon :src="item.media.icon.url" size="medium"/>
                <UILabel>{{item.media.name}}</UILabel>
              </UIFlex>
              <UILabel>{{fmtResourceAmount(item.amount)}} uds</UILabel>
            </UIFlex>
            </template>
            <template v-slot:selected="item">
            <UIFlex direction="row" padding="10" justifyContent="space-between" alignItems="center" >
              <UIFlex direction="row" gap="10" alignItems="center" >
                <UIIcon :src="item.media.icon.url" size="medium"/>
                <UILabel>{{item.media.name}}</UILabel>
              </UIFlex>
              <UILabel>{{fmtResourceAmount(item.amount)}} uds</UILabel>
            </UIFlex>
            </template>
        </UIDropdown>
        <UIFlex direction="row" justifyContent="space-between" alignItems="stretch" gap="5">
          <UILabel class="quantity-label">Unidades</UILabel>
          <input class="amount" type="number" v-model="amount" min="0" />
          <UIButton grow @onClick="addResource()" :disabled="addDisabled">Añadir</UIButton>
        </UIFlex>
      </UIFlex>
    </UISection>
    <UISection title="Contingente" v-if="resources.length">
      <UIFlex gap="10">
        <UIFlex direction="row" justifyContent="space-between" v-for="(item,index) in resources" :key="index" alignItems="center">
          <UIFlex direction="row" justifyContent="flex-start"  alignItems="center" gap="10">
            <UIIcon :src="item.media.icon.url" size="medium"/>
            <UILabel :class="item.type">Enviar {{fmtResourceAmount(item.amount)}} {{item.media.name}}</UILabel>
          </UIFlex>
          <UIButton justify="center" @onClick="deleteResource(index)">
            <UIIcon :src="deleteIcon" size="medium" />
          </UIButton>
        </UIFlex>
      </UIFlex>
    </UISection>
    
    <UIButton @onClick="sendAttack" grow :borderless="true" justify="center" :style="{width:'50%'}" v-if="availability.available">
        <UIIcon :src="activity.media.icon.url" size="medium" />
        <UILabel class="large">Iniciar</UILabel>
    </UIButton>

    <UIFlex class="disabled" gap="10" padding="10" direction="row" alignItems="center" v-else>
        <UIIcon :src="activity.media.icon.url" size="large"/>
        <UIFlex  gap="10">
            <UILabel class="large bold">{{activity.media.name}}</UILabel>
            <UILabel v-for="(cause,index) in availability.info" :key="index" class="warn" >{{cause}}</UILabel>
        </UIFlex>
    </UIFlex>

  </UIFlex>
</template>

<script lang="ts">
import { GameEvents, useGameAPI } from '@/game/services/gameApi'
import { ActivityType, Resource, ResourceAmount, TradingAgreement, WithAmount } from 'server/monolyth';
import { computed, defineComponent, onMounted, onUnmounted, PropType, Ref, ref } from 'vue'
import ResourceFlowItem from '../game/ResourceFlowItem.vue';
import UIDropdown from '../ui/UIDropdown.vue';
import * as UI from '../ui/';
import { toMap } from 'server/functions';
import { fmtResourceAmount } from '@/game/classes/formatters';
import {deleteIcon,timeIcon} from '../ui/icons'
import { AttackIPTarget, TradeIPTarget } from '@/game/classes/info';
import { closeInfoPanel, goBackInfoPanelHistory, showErrorPanel } from '@/game/controllers/ui';
import { ActivityAvailability, ActivityCost, AttackActivityTarget } from '@/game/classes/activities';

export default defineComponent({
  components:{...UI,UIDropdown,ResourceFlowItem},
  props:{
    target:Object as PropType<AttackIPTarget>
  },
  setup(props) {
    const api = useGameAPI();
    const amount = ref<string>('0');
    const gameData = api.getGameData();
    const resourceIndex = ref<number>(0);
    const activity = api.getActivity(ActivityType.Attack);
    const apiChanged = ref<number>(Date.now());
    
    const apiHandler = ()=>{
      apiChanged.value = Date.now();
    }
    const resources:Ref<WithAmount<Resource>[]> = ref<WithAmount<Resource>[]>([]);
    const availableResources = computed<WithAmount<Resource>[]>(()=>{
      apiChanged.value;

      const list:WithAmount<Resource>[] =  [];
      const stockpileMap = toMap(api.getCurrentPlayer().stockpiles, sp => sp.resourceId);
      
      for(const i in gameData.resources){
        list.push({...gameData.resources[i],amount:stockpileMap[i].amount})
      }
      
      return list;
    });
    const cost = computed<ActivityCost>(()=>{
        return api.getActivityCost(activity.type!,target.value);
    });
    const resourceChanged = (index:number) => {
      resourceIndex.value = index;
    };

    const resourceSelected = computed<WithAmount<Resource>>(()=>{
      return availableResources.value[resourceIndex.value];
    });

    const addDisabled = computed<boolean>(()=>{
      let disabled = true;
      if(amount.value && resourceSelected.value) {
        const i = parseInt(amount.value);
        console.log(i);
        disabled = i > resourceSelected.value.amount  || i <1;
      }

      return disabled;
    })
  
    const addResource = () => {
      const res = resourceSelected.value;
      console.log(res.id);
      const value = parseInt(amount.value || '0');
      
      if(res && value){
        const previous = resources.value.find( item => item.id == res.id);
        
        if(previous){
          previous.amount+=value;
        }else{
          resources.value.push({...res,amount:value});
        }
      }
    }

    const deleteResource = (index:number) => {
      console.log(index);
      resources.value = resources.value.filter( (item,i) => i != index);
    }
    const target = computed<AttackActivityTarget>(()=>{
        const dstPlayer = props.target!.player;

        return {
            instancePlayerId:dstPlayer.playerId!,
            resources:resources.value.map(res => ({resourceId:res.id,amount:res.amount})),
            name:'Atacar a '+dstPlayer.media!.name
        }
    })
    const availability = computed<ActivityAvailability>(()=>{
      apiChanged.value;

      console.log('Checking availability of',props.target);
      return api.checkActivityAvailability(activity.type,target.value);
    });
    const attackDisabled = computed<boolean>(()=>{
        return resources.value.length == 0;
    });

    const sendAttack = async ()=>{
      try{
          await api.startActivity(activity.type,target.value);
          closeInfoPanel();
      }catch(err){
          showErrorPanel(err as string);
      }
    }
    onMounted(()=>{
      api.on(GameEvents.Timer,apiHandler);
    });
    onUnmounted(()=>{
      api.off(GameEvents.Timer,apiHandler);
    })
    return {
      timeIcon,deleteIcon,activity,availability,cost,
      addResource,deleteResource,resources,addDisabled,availableResources,resourceChanged,resourceSelected,
      amount,fmtResourceAmount,sendAttack,attackDisabled
    };
  },
})
</script>

<style lang="scss" scoped>
  .resource-select
  .ui-dropdown{
    flex-grow:1;
    padding:3px;
  }
  .amount{
    width:100px;
    text-align: right;
    padding-right:20px;
  }
  .quantity-label{
    align-self:center;
    flex-grow:1;
  }
  .offer{
    color:var(--ui-danger);
  }
  .request{
    color:var(--ui-success);
  }
  .ui-flex.disabled{
        opacity:0.5;
}
    .warn{
        color:var(--ui-danger);
        font-style:italic;
    }
</style>