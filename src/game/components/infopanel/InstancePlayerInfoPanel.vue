<template>
     <!-- Activities -->
    <UISection title="Actividades" class="ml-10">
        <UIFlex padding="10" v-for="(activity,index) in activities" :key="index">
            <UIButton :borderless="true" :rounded="false" grow @onClick="performActivity(activity)" >
                <UIIcon :src="activity.media.icon.url" size="large" />
                <UILabel>{{activity.media.name}}</UILabel>
            </UIButton>
        </UIFlex>
    </UISection>
</template>

<script lang="ts">

import { AssetManager, ConstantAssets } from '@/game/classes/assetManager';
import { InstancePlayerIPTarget } from '@/game/classes/info';
import { useGameAPI } from '@/game/services/gameApi';
import { Activity, ActivityType } from 'shared/monolyth';
import { defineComponent, PropType } from 'vue'
import * as UI from '../ui';

export default defineComponent({
    components:{...UI},
    props:{
        target:Object as PropType<InstancePlayerIPTarget>
    },
    setup(props) {
        const api = useGameAPI();
        
        const attack = api.getActivity(ActivityType.Attack);
        const spy = api.getActivity(ActivityType.Spy);
        const trade = api.getActivity(ActivityType.Trade);
        const message = api.getActivity(ActivityType.Message);
        const performActivity = (activity:Activity) => {
            //console.log('Sacar el modal de ',activity)
            props.target?.actionCallback(InstancePlayerIPTarget.ACTION_MESSAGE,props.target);
        };
        const activities = [attack,spy,trade,message]
        return {activities,performActivity}
    },
})
</script>

<style>

</style>