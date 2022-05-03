<template>
    <UIFlex class="resource-flow" :class="type||'default'" direction="row" gap="5" alignItems="center">
        <UIIcon :src="icon" :title="resource" size="medium" />
        <span class="production-speed">{{productionSpeed}}</span>
    </UIFlex>
</template>

<script lang="ts">
import { useGameAPI } from '@/game/services/gameApi';
import { computed, defineComponent } from '@vue/runtime-core';
import { FlowPeriodicity, ResourceAmount, ResourceFlow } from '@/shared/monolyth';
import UIIcon from '../ui/UIIcon.vue'
import UIFlex from '../ui/UIFlex.vue'
function getAmount(amount:ResourceAmount):string{
    return Math.abs(amount.amount).toFixed(2)+ ' unidades';
}
function getProductionSpeed(flow:ResourceFlow):string {
    let unit = '';
    switch(flow.periodicity){
        case FlowPeriodicity.PerSecond:
            unit = '/ segundo';
            break;
        case FlowPeriodicity.PerMinute:
            unit = '/ minuto';
            break;
        case FlowPeriodicity.PerHour:
            unit = '/ hora';
            break;
        case FlowPeriodicity.PerDay:
            unit = '/ día';
            break;
        case FlowPeriodicity.PerWeek:
            unit = '/ semana';
            break;
    }
    return Math.abs(flow.amount).toFixed(2)+ ' '+unit;
}

export default defineComponent({
    props:["flow","type"], // type=income|expense
    components:{UIIcon,UIFlex},
    setup(props){
        const gameDef = useGameAPI().getGameData();
        const flowType = computed<string>( ()=> props.flow.amount >= 0 ? 'income': 'expense');
        const productionSpeed = computed<string>( ()=> {
            return props.flow['periodicity']!=undefined?getProductionSpeed(props.flow):getAmount(props.flow);
        }); 
        const resource = computed<string>( ()=> gameDef.resources[props.flow.resourceId].media.name );
        const icon = computed<string>( ()=> gameDef.resources[props.flow.resourceId].media.icon.url );
       // mounted(){
        return {icon,flowType,productionSpeed,resource};
    }
});
</script>

<style lang="scss" scoped>
   
    .income{
        color:$ui-resource-flow-positive;
    }
    .expense{
        color:$ui-resource-flow-negative;
    }
</style>