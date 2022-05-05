<template>
    <UIFlex gap="20">
        <UILabel :class="report.success?'success':'failure'">{{ report.success?'Misión finalizada con éxito':'La misión ha fracasado'}}</UILabel>
        <UILabel >La probabilidad de éxito era de un {{report.probability}}%</UILabel>
        <UISection title="Origen">
            <UILabel @onClick="openPlayer" link>{{report.playerName}}</UILabel>
        </UISection>
        <UISection title="Almacenes" v-if="resources.length">
            <UIFlex gap="10">
                <ResourceQuantity v-for="(item,index) in resources" :key="index" :item="item"/>
            </UIFlex>
        </UISection>
        <UISection title="Investigación" v-if="technologies.length">
            <UIFlex gap="10">
                <UIFlex direction="row" justifyContent="flex-start"  alignItems="center" gap="10" v-for="(item,index) in technologies" :key="index">
                    <UIIcon :src="item.media.icon.url" size="medium"/>
                    <UILabel>{{item.media.name}}</UILabel>
                </UIFlex>
            </UIFlex>
        </UISection>
    </UIFlex>
</template>

<script lang="ts">
import { useGameAPI } from '@/game/services/gameApi';
import { Resource, SpyReport, Technology, WithAmount } from '@/shared/monolyth';
import { computed, defineComponent, PropType } from 'vue'
import {fmtResourceAmount} from '../../classes/formatters';
import * as UI from '../ui/';
import ResourceQuantity from '../game/ResourceQuantity.vue';
import { showErrorPanel, showInfoPanel2 } from '@/game/controllers/ui';
import { InstancePlayerIPTarget } from '@/game/classes/info';
export default defineComponent({
    props:{
        report:Object as PropType<SpyReport>
    },
    components:{...UI,ResourceQuantity},
    setup(props) {
    /*report = {
                success:true,
                properties : opponent!.properties,
                cells:opponent!.cells,
                technologies:opponent!.technologies,
                stockpiles:opponent!.stockpiles
            }        */
        const api = useGameAPI();
        const gameData = api.getGameData();

        const resources = computed<WithAmount<Resource>[]>(()=>{
            const list:WithAmount<Resource>[] = [];
            (props.report?.stockpiles || []).forEach( item => {
                list.push({
                    ...gameData.resources[item.resourceId],
                    amount:item.amount
                });
            })
            return list;
        });

        const openPlayer = async ()=>{ 
            try{
                const player = await api.getInstancePlayer(props.report!.playerId!);
                showInfoPanel2(new InstancePlayerIPTarget(player));
            }catch(err){
                showErrorPanel(err as string);
            }
        }
            
        const technologies = computed<Technology[]>( ()=>{
            return (props.report?.technologies || []).map( techId => gameData.technologies[techId]);
        });

        return {resources,technologies,fmtResourceAmount,openPlayer}
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

