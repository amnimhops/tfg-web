<template>
  <UIFlex gap="20" padding="10">
    <UISection title="Recursos">
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
          <UILabel class="quantity-label">Número de unidades</UILabel>
          <input class="amount" type="number" v-model="amount" min="0" />
        </UIFlex>
        <UIFlex direction="row" justifyContent="space-between" alignItems="stretch" gap="10">
          <UIButton grow justify="center" :disabled="offerDisabled" @onClick="addItem('offer')">Ofrecer</UIButton>
          <UIButton grow justify="center" @onClick="addItem('request')">Solicitar</UIButton>
        </UIFlex>
      </UIFlex>
    </UISection>
    <UISection title="Trato" v-if="sortedDeal.length">
      <UIFlex gap="10">
        <UIFlex direction="row" justifyContent="space-between" v-for="(item,index) in sortedDeal" :key="index" alignItems="center">
          <UIFlex direction="row" justifyContent="flex-start"  alignItems="center" gap="10">
            <UIIcon :src="item.resource.media.icon.url" size="medium"/>
            <UILabel :class="item.type">{{item.type=='offer'?'Enviar':'Recibir'}} {{fmtResourceAmount(item.amount)}} {{item.resource.media.name}}</UILabel>
          </UIFlex>
          <UIButton justify="center" @onClick="deleteItem(index)">
            <UIIcon :src="deleteIcon" size="medium" />
          </UIButton>
        </UIFlex>
      </UIFlex>
    </UISection>
    <UIButton justify="center" @onClick="sendTradingDeal" class="mt-20 mb-20" v-if="sortedDeal.length>0">
      <UIIcon :src="deleteIcon" size="medium" />
      <UILabel class="large bold">Enviar solicitud</UILabel>
    </UIButton>
  </UIFlex>
</template>

<script lang="ts">
import { GameEvents, useGameAPI } from '@/game/services/gameApi'
import { Resource, ResourceAmount, TradingAgreement, WithAmount } from 'server/monolyth';
import { computed, defineComponent, onMounted, onUnmounted, PropType, Ref, ref } from 'vue'
import UIDropdown from '../ui/UIDropdown.vue';
import * as UI from '../ui/';
import { toMap } from 'server/functions';
import { fmtResourceAmount } from 'server/functions';
import {deleteIcon} from '../ui/icons'
import { TradeIPTarget } from '@/game/classes/info';
import { goBackInfoPanelHistory, showErrorPanel } from '@/game/controllers/ui';

interface DealItem {
  resource:Resource;
  amount:number;
  type:'request'|'offer';
}

export default defineComponent({
  components:{...UI,UIDropdown},
  props:{
    target:Object as PropType<TradeIPTarget>
  },
  setup(props) {
    const api = useGameAPI();
    const amount = ref<string>('0');
    const gameData = api.getGameData();
    const resourceIndex = ref<number>(0);

    const apiChanged = ref<number>(Date.now());
    const apiHandler = ()=>{
      apiChanged.value = Date.now();
    }
    const deal:Ref<DealItem[]> = ref<DealItem[]>([]);
    const sortedDeal = computed<DealItem[]>(()=>{
      return [...deal.value].sort( (a,b) => a.type.localeCompare(b.type));
    })
    const availableResources = computed<WithAmount<Resource>[]>(()=>{
      apiChanged.value;

      const list:WithAmount<Resource>[] =  [];
      const stockpileMap = toMap(api.getCurrentPlayer().stockpiles, sp => sp.resourceId);
      
      for(const i in gameData.resources){
        list.push({...gameData.resources[i],amount:stockpileMap[i].amount})
      }
      
      return list;
    });

    const resourceChanged = (index:number) => {
      resourceIndex.value = index;
    };

    const resourceSelected = computed<WithAmount<Resource>>(()=>{
      return availableResources.value[resourceIndex.value];
    });

    const offerDisabled = computed<boolean>(()=>{
      let disabled = true;
      if(amount.value && resourceSelected.value) {
        disabled = parseInt(amount.value) > resourceSelected.value.amount;
      }

      return disabled;
    })
  
    const addItem = (itemType:'offer'|'request') => {
      const res = resourceSelected.value;
      console.log(res.id);
      const value = parseInt(amount.value || '0');
      
      if(res && value){
        const previous = deal.value.find( item => item.resource.id == res.id && item.type == itemType);
        
        if(previous){
          // Ya existe el recurso en la pila, se combinan las cantidades
          previous.amount+=value;
        }else{
          deal.value.push({
            resource:res,
            amount:value,
            type:itemType
          });
        }
      }
    }

    const deleteItem = (index:number) => {
      console.log(index);
      deal.value = deal.value.filter( (item,i) => i != index);
    }

    const sendTradingDeal = async ()=>{
      const srcPlayer = api.getCurrentPlayer();
      const dstPlayer = props.target!.player;
      console.log(dstPlayer)
      const agreement:TradingAgreement = {
        srcPlayerId:srcPlayer.playerId,
        dstPlayerId:dstPlayer.playerId!,
        offer:deal.value.filter( item => item.type == 'offer').map( item => ({resourceId:item.resource.id,amount:item.amount} as ResourceAmount)),
        request:deal.value.filter( item => item.type == 'request').map( item => ({resourceId:item.resource.id,amount:item.amount} as ResourceAmount)),
      }

      try{
        await api.sendTradeAgreement(agreement);
        goBackInfoPanelHistory();
      }catch(err){
        showErrorPanel(err as string);
      }
    }
    onMounted(()=>{
      api.off(GameEvents.Timer,apiHandler);
    });
    onUnmounted(()=>{
      api.off(GameEvents.Timer,apiHandler);
    })
    return {
      deleteIcon,
      addItem,deleteItem,sortedDeal,
      offerDisabled,availableResources,resourceChanged,resourceSelected,amount,fmtResourceAmount,
      sendTradingDeal
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
</style>