<template>
    <!--Resource flows-->
    <UISection title="Produce" class="ml-10" v-if="incomes.length">
        <UIFlex padding="10" gap="10">
            <ResourceFlowItem v-for="(flow,index) in incomes" :key="index" :flow="flow" type="income"/>
        </UIFlex>
    </UISection>
    <UISection title="Consume" class="ml-10" v-if="expenses.length">
        <UIFlex padding="10" gap="10">
            <ResourceFlowItem v-for="(flow,index) in expenses" :key="index" :flow="flow" type="expense"/>
        </UIFlex>
    </UISection>
</template>

<script lang="ts">
import ResourceFlowItem from '../game/ResourceFlowItem.vue';
import UISection from '../ui/UISection.vue';
import UIFlex from '../ui/UIFlex.vue';
import { PlaceableIPTarget } from '@/game/classes/info'
import { ResourceFlow } from '@/shared/monolyth';
import { computed, defineComponent, PropType } from 'vue'


export default defineComponent({
    props:{
        target: Object as PropType<PlaceableIPTarget>
    },
    components:{ResourceFlowItem,UISection,UIFlex},
    setup(props) {
            
        const incomes = computed<ResourceFlow[]>( () => {
            const f = props.target?.placeable.flows.filter( flow => flow.amount > 0) || [];
            return f;
        });
        const expenses = computed<ResourceFlow[]>( () => {            
            return props.target?.placeable.flows.filter( flow => flow.amount < 0) || [];
        });
        
        return {
            incomes,
            expenses
        }
    },
})
</script>
