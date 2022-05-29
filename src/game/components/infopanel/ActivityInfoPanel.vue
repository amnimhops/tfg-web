<template>
    <UIFlex gap="20" padding="10">
        <UIFlex gap="10">
            <UIFlex direction="row" gap="10" alignItems="center">
                <UIIcon :src="timeIcon" size="medium"/>
                <UILabel>Duración {{cost.duration}}</UILabel>
            </UIFlex>
            <ResourceFlowItem v-for="(flow,index) in cost.resources" :key="index" :flow="flow" type="expense"/>
        </UIFlex>

        <UIButton @onClick="start" grow :borderless="true" justify="center" :style="{width:'50%'}" v-if="availability.available">
            <UIIcon :src="target.activity.media.icon.url" size="medium" />
            <UILabel class="large">Iniciar</UILabel>
        </UIButton>
        <UIFlex class="disabled" gap="10" padding="10" direction="row" alignItems="center" v-else>
            <UIIcon :src="target.activity.media.icon.url" size="large"/>
            <UIFlex  gap="10">
                <UILabel class="large bold">{{target.activity.media.name}}</UILabel>
                <UILabel v-for="(cause,index) in availability.info" :key="index" class="warn" >{{cause}}</UILabel>
            </UIFlex>
        </UIFlex>
        
  </UIFlex>
</template>

<script lang="ts">
import { ActivityIPTarget } from '@/game/classes/info';
import { goBackInfoPanelHistory, showErrorPanel } from '@/game/controllers/ui';
import { GameEvents, useGameAPI } from '@/game/services/gameApi';
import { computed, defineComponent, onMounted, PropType, ref } from 'vue'
import ResourceFlowItem from '../game/ResourceFlowItem.vue'
import {timeIcon} from '../ui/icons'

import * as UI from '../ui/';
import { ActivityAvailability, ActivityCost } from 'server/activities';


export default defineComponent({
    components: { ...UI,ResourceFlowItem },
    props:{
        target:Object as PropType<ActivityIPTarget>
    },
    setup(props,{emit}) {
        const api = useGameAPI();
        const apiChanged = ref<number>(Date.now());

        const apiHandler = ()=>{
            apiChanged.value = Date.now();
        }
        
        const cost = computed<ActivityCost>(()=>{
            const i= api.getActivityCost(props.target!.activityType!,props.target!.target);
                console.log(i);
            return i;
        });
        const availability = computed<ActivityAvailability>(()=>{
            apiChanged.value;
            console.log('Checking availability of',props.target);
            return api.checkActivityAvailability(props.target!.activityType,props.target!.target);
        });
        const start = async ()=>{
             try{
                await api.startActivity(props.target!.activityType,props.target!.target);
                console.log('Activity request send');
                if(props.target?.callback){
                    props.target.callback();
                }
             }catch(err){
                console.log('Activity request error');
                showErrorPanel(err as string);
            }
        }
        onMounted(()=>{
            api.on(GameEvents.Timer,apiHandler);
        })

        return {timeIcon,start,cost,availability};
    },
})
</script>
<style lang="scss" scoped>
    .ui-flex.disabled{
        opacity:0.5;
    }
    .warn{
        color:var(--ui-danger);
        font-style:italic;
    }
</style>