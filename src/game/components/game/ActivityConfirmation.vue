<template>
  <!-- Modal de confirmación -->
  <UIModal :title="model.title" @onClose="cancel">
    <template v-slot:content>
      <UISection title="Coste de la actividad" class="ml-10">
        <UIFlex padding="10" gap="10">
          <ResourceFlowItem v-for="(flow,index) in activityCosts" :key="index" :flow="flow"/>
        </UIFlex>
      </UISection>
      <UISection title="Impedimentos (...)" class="ml-10" v-if="!availability.available">
        <UIFlex padding="10" gap="10">
          <UILabel v-for="(info,index) in availability.info" :key="index">{{info}}</UILabel>
        </UIFlex>
      </UISection>
    </template>
    <template v-slot:footer>
      <UIFlex direction="row" justifyContent="space-between">
        <UIButton :disabled="!availability.available" @onClick="start"><UIIcon :src="acceptIcon" size="medium" /><span>Comenzar</span></UIButton>
        <UIButton @onClick="cancel"><UIIcon :src="closeIcon" size="medium" /><span>Cancelar</span></UIButton>
      </UIFlex>
    </template>
  </UIModal>
</template>

<script lang="ts">

import * as UI from '../ui/';
import { ActivityAvailability, ActivityConfirmationModel, ActivityInfo } from '@/game/classes/activities'
import ResourceFlowItem from './ResourceFlowItem.vue';
import { computed, defineComponent, PropType, ref } from 'vue'
import { ActivityCost, GameEvents, useGameAPI } from '@/game/services/gameApi';
import { ResourceAmount, ResourceFlow } from 'shared/monolyth';
import {acceptIcon,closeIcon} from '../ui/icons'
export default defineComponent({
    props:{
        model:Object as PropType<ActivityConfirmationModel>
    },
    emits:['onCancel','onAccept'],
    components:{...UI,ResourceFlowItem},
    setup(props,{emit}) {
        const api = useGameAPI();
        const apiChanged = ref<number>(Date.now());

        api.on(GameEvents.Timer,()=>{

            apiChanged.value = Date.now();
        });

        /**
         * Coste de la actividad, se recalcula cada segundo por vinculación
         * con el temporizador de la API
         */
        const activityCosts = computed<ActivityCost>(()=>{
            apiChanged.value;
            return api.getActivityCost(props.model!.activityInfo.type,props.model?.activityInfo.target);
        })
        /**
         * Disponibilidad para llevar a cabo la actividad,se recalcula 
         * cada segundo por vinculación con el temporizador de la API
         */
        const availability = computed<ActivityAvailability>(()=>{
            apiChanged.value;
            const i = api.checkActivityAvailability(props.model!.activityInfo.type,props.model?.activityInfo.target);
            console.log(i);
            return i;
        });

        const cancel = () => {
            emit('onCancel');
        }

        const start = () => {
            emit('onAccept');
        }

        return {activityCosts,availability,cancel,start,acceptIcon,closeIcon}
    },
})
</script>

<style>

</style>