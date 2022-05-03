<template>
    <UIFlex gap="20">
        <UILabel>Informe de la misión</UILabel>
        <UISection title="Botín" v-if="reward.length">
            <UIFlex gap="10">
                <ResourceQuantity v-for="(item,index) in reward" :key="index" :item="item"/>
            </UIFlex>
        </UISection>
        <UISection title="Bajas propias" v-if="ownCasualties.length">
            <UIFlex gap="10">
                <ResourceQuantity v-for="(item,index) in ownCasualties" :key="index" :item="item"/>
            </UIFlex>
        </UISection>
        <UISection title="Bajas enemigas" v-if="enemyCasualties.length">
            <UIFlex gap="10">
                <ResourceQuantity v-for="(item,index) in enemyCasualties" :key="index" :item="item"/>
            </UIFlex>
        </UISection>
        <UISection title="Edificios destruidos" v-if="destroyedPlaceables.length">
            <UIFlex gap="10">
                <ResourceQuantity v-for="(item,index) in destroyedPlaceables" :key="index" :item="item"/>
            </UIFlex>
        </UISection>
    </UIFlex>
</template>

<script lang="ts">
import { useGameAPI } from '@/game/services/gameApi';
import { Placeable, Resource, ResourceAmount, SpyReport, Technology, WithAmount } from '@/shared/monolyth';
import { computed, defineComponent, PropType } from 'vue'
import {fmtResourceAmount} from '../../classes/formatters';
import * as UI from '../ui/';
import ResourceQuantity from '../game/ResourceQuantity.vue';
import { SimplifiedCombatSummary } from '@/game/classes/combat';
export default defineComponent({
    props:{
        report:Object as PropType<SimplifiedCombatSummary>
    },
    components:{...UI,ResourceQuantity},
    setup(props) {

        const api = useGameAPI();
        const gameData = api.getGameData();

        const reward = computed<WithAmount<Resource>[]>(()=>{
            const list:WithAmount<Resource>[] = [];
            (props.report?.warSpoil || []).forEach( item => {
                list.push({
                    ...gameData.resources[item.resourceId],
                    amount:item.amount
                });
            })
            return list;
        });

        const fillWithResource = (where?:ResourceAmount[])=> {
            const list:WithAmount<Resource>[] = [];
            (where || []).forEach( item => {
                list.push({
                    ...gameData.resources[item.resourceId],
                    amount:item.amount
                });
            })
            return list;
        }

        const ownCasualties =computed<WithAmount<Resource>[]>(()=>{
            return fillWithResource(props.report?.attackerResourceCasualties)
        });

        const enemyCasualties =computed<WithAmount<Resource>[]>(()=>{
            return fillWithResource(props.report?.defenderResourceCasualties)
        });
        const destroyedPlaceables = computed<WithAmount<Placeable>[]>(()=>{
            return Object.entries(props.report!.defenderPlaceableCasualties).map( entry => {
                const id = entry[0];
                const placeable = gameData.placeables[id];
                return {
                    ...placeable,
                    amount:entry[1]
                } as WithAmount<Placeable>
            })
        });

        return {reward,ownCasualties,enemyCasualties,destroyedPlaceables,fmtResourceAmount}
    },
})
</script>

<style lang="scss" scoped>
    .success{
        color:$ui-success;
        font-weight:bold;
    }
    .failure{
        color:$ui-danger;
        font-weight:bold;
    }
</style>

