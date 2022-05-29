<template>
    <UIFlex gap="20">
        <UISection title="Solicita" v-if="request.length">
            <UIFlex gap="10">
                <ResourceQuantity v-for="(item,index) in request" :key="index" :item="item"/>
            </UIFlex>
        </UISection>
        <UISection title="Ofrece" v-if="offer.length">
            <UIFlex gap="10">
                <ResourceQuantity v-for="(item,index) in offer" :key="index" :item="item"/>
            </UIFlex>
        </UISection>
        <UIFlex class="mt-20 mb-20" direction="row" justifyContent="space-between" v-if="stillActive">
            <UIButton @onClick="accept" :disabled="notEnoughResources">
                <UIIcon :src="acceptIcon" size="medium" />
                <UILabel class="large bold">Aceptar</UILabel>
            </UIButton>
            <UIButton @onClick="reject">
                <UIIcon :src="closeIcon" size="medium" />
                <UILabel class="large bold">Rechazar</UILabel>
            </UIButton>
        </UIFlex>
        <UIFlex v-else class="mt-20 mb-20" direction="row">
            <UILabel class="failure">Este trato comercial ya no está disponible</UILabel>
        </UIFlex>
    </UIFlex>
</template>

<script lang="ts">
import { GameEvents, useGameAPI } from '@/game/services/gameApi';
import { toMap } from 'server/functions';
import { ResourceAmount,TradingAgreement, WithMedia } from 'server/monolyth';
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref } from 'vue'
import {fmtResourceAmount} from 'server/functions';
import * as UI from '../ui';
import {acceptIcon,closeIcon} from '../ui/icons'
import ResourceQuantity from '../game/ResourceQuantity.vue'
import { closeInfoPanel, showErrorPanel } from '@/game/controllers/ui';
export default defineComponent({
    props:{
        report:Object as PropType<TradingAgreement>
    },
    components:{...UI,ResourceQuantity},
    setup(props) {
        const api = useGameAPI();
        const gameData = api.getGameData();
        const apiChanged = ref<number>(Date.now());

        const stillActive = ref<boolean>(false);
        const offer = computed<WithMedia<ResourceAmount>[]>(()=>{
            return (props.report?.offer||[]).map( item => ({...item,media:gameData.resources[item.resourceId].media}));
        });
        const request = computed<WithMedia<ResourceAmount>[]>(()=>{
            return (props.report?.request||[]).map( item => ({...item,media:gameData.resources[item.resourceId].media}));
        });
        
        const notEnoughResources = computed<boolean>(()=>{
            apiChanged.value;
            console.log('fus')
            const stockpileMap = toMap(api.getCurrentPlayer().stockpiles, sp => sp.resourceId);
            if(props.report!.request.length > 0){
                return props.report!.request.every( item => item.amount > stockpileMap[item.resourceId].amount);
            }else{
                return false;
            }
        })

        const apiHandler = ()=>{
            apiChanged.value = Date.now();
        }
        const accept = async ()=>{
            try{
                console.log('Agreement accepted');
                const agreementId = props.report!.id!; // A veces parece que haya que decirle a typescript las cosas gritando...
                await api.acceptTradeAgreement(agreementId);
                closeInfoPanel();
            }catch(err){
                showErrorPanel(err as string);
            }
        }
        
        const reject = async ()=>{
            try{
                console.log('rejected');
                const agreementId = props.report!.id!; // A veces parece que haya que decirle a typescript las cosas gritando...
                await api.cancelTradeAgreement(agreementId);
                closeInfoPanel();
            }catch(err){
                showErrorPanel(err as string);
            }
        }

        onMounted(async ()=>{
            api.on(GameEvents.Timer,apiHandler);
            try{
                const agreement = await api.getTradeAgreement(props.report!.id!);
                stillActive.value = true;
            }catch(err){
                console.warn('El trato comercial no existe, se entiende como cancelado');
                stillActive.value = false;
            }
        });
        onUnmounted(()=>{
            api.off(GameEvents.Timer,apiHandler);
        });
        

        return {
            acceptIcon,closeIcon,
            offer,request,notEnoughResources,stillActive,
            accept,reject,fmtResourceAmount}
    },
})
</script>

<style lang="scss" scoped>
    .success{
        color:var(--ui-success);
        font-weight:bold;
    }
    .failure{
        color:var(--ui-danger);
        font-weight:bold;
    }
</style>

