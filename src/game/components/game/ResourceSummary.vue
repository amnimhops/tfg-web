<template>
<UIFlex class="resource-summary" direction="row" alignItems="stretch" gap="10">
    <UIIcon :src="stat.resource.media.icon.url" :size="iconSize" />
    <UIFlex :grow="true" justifyContent="space-between">
        <UIFlex class="mt-5" gap="5">
            <UILabel class="large" :link="true" @onClick="navigate(stat.resource.id)">{{stat.resource.media.name}}</UILabel>
            <UIFlex direction ="row" justifyContent="space-between">
                <UILabel class="medium">Almacén</UILabel>
                <UILabel>{{fmtResourceAmount(stat.available)}}</UILabel>
            </UIFlex>
            <UIFlex direction="row" justifyContent="space-between">
                <UILabel class="medium">Producción</UILabel>
                <UILabel class="income">{{fmtResourceAmount(stat.totalIncome)}}/sec.</UILabel>
            </UIFlex>
            <UIFlex direction="row" justifyContent="space-between">
                <UILabel class="medium">Consumo</UILabel>
                <UILabel class="expense" >{{fmtResourceAmount(Math.abs(stat.totalExpense))}}/sec.</UILabel>
            </UIFlex>
        </UIFlex>
    </UIFlex>
</UIFlex>
</template>

<script lang="ts">
import { ResourceStat } from '@/game/services/gameApi';
import { defineComponent, PropType } from 'vue'
import { useRouter } from 'vue-router';
import { fmtResourceAmount } from 'server/functions';
import * as UI from '../ui/';

export default defineComponent({
    props:{
        stat:Object as PropType<ResourceStat>,
        iconSize:String
    },
    components:{...UI},
    setup() {
        const router = useRouter();

        const navigate = (id:string) => router.push({name:'resource',params:{id}});

        return {fmtResourceAmount,navigate};

        
    },
})
</script>

<style lang="scss">
.big-numbers{
    font-weight: bold; 
    
    .ui-label{
        width:20%;
        text-align: right;
    }
}
.expense{
    color:var(--ui-danger);
}
.income{
    color:var(--ui-success);
}

</style>