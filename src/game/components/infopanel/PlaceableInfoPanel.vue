<template>
  <!--Resource flows-->
    <UISection title="Recursos generados" class="ml-10">
        <UIFlex padding="10" gap="10">
            <ResourceFlowItem v-for="(flow,index) in incomes" :key="index" :flow="flow"/>
        </UIFlex>
    </UISection>
    <UISection title="Recursos consumidos" class="ml-10">
        <UIFlex padding="10" gap="10">
            <ResourceFlowItem v-for="(flow,index) in expenses" :key="index" :flow="flow"/>
        </UIFlex>
    </UISection>
    <UISection title="Actividades" class="ml-10">
        <UIFlex padding="10">
            <UIButton :borderless="true" :rounded="false" grow @onClick="dismantle">
                <UIIcon :src="iconDismantle" size="large" />
                <UILabel>Desmantelar</UILabel>
            </UIButton>
        </UIFlex>
    </UISection>
</template>

<script lang="ts">
import ResourceFlowItem from '../game/ResourceFlowItem.vue';
import UISection from '../ui/UISection.vue';
import UIFlex from '../ui/UIFlex.vue';
import UIButton from '../ui/UIButton.vue';
import UILabel from '../ui/UILabel.vue';
import UIIcon from '../ui/UIIcon.vue';
import { ExistingPlaceableIPTarget } from '@/game/classes/info'
import { useGameAPI } from '@/game/services/gameApi'
import { ResourceFlow } from 'shared/monolyth';
import { computed, defineComponent, PropType } from 'vue'
import { AssetManager, ConstantAssets } from '@/game/classes/assetManager';

export default defineComponent({
    props:{
        target: Object as PropType<ExistingPlaceableIPTarget>
    },
    components:{ResourceFlowItem,UISection,UIFlex,UIButton,UILabel,UIIcon},
    setup(props) {
        const api = useGameAPI();
        const iconDismantle = AssetManager.get(ConstantAssets.ICON_DISMANTLE).url;

        const incomes = computed<ResourceFlow[]>( () => {
            const f = api.getGameData().placeables[props.target!.pid].flows.filter( flow => flow.amount > 0);
            console.log(f);
            return f;
        });
        const expenses = computed<ResourceFlow[]>( () => {
            
            return api.getGameData().placeables[props.target!.pid].flows.filter( flow => flow.amount < 0);
        });

        return {incomes,expenses,iconDismantle}
    },
})
</script>


<style>

</style>
