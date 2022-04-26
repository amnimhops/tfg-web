<template>
    <template v-if="!availability.available">
        <UIFlex class="disabled" gap="10" padding="10" direction="row" alignItems="center">
            <UIIcon  :src="activity.media.icon.url" size="large" />
            <UIFlex  gap="10">
                <UILabel>{{activity.media.name}}</UILabel>
                <UILabel class="warn">{{availability.info[0]}}</UILabel>
            </UIFlex>
        </UIFlex>
    </template>
    <template v-else>
        <UIButton @onClick="emit('onClick')">
            <UIIcon :src="activity.media.icon.url" size="large" />
            <span>{{activity.media.name}}</span>
        </UIButton>
    </template>
</template>

<script lang="ts">
import * as UI from '../ui/';
import { ActivityAvailability } from '@/game/classes/activities'
import { useGameAPI } from '@/game/services/gameApi'
import { Activity, ActivityTarget, ActivityType } from 'shared/monolyth'
import { computed, defineComponent, PropType } from 'vue'


export default defineComponent({
    props:{
        type:Number as PropType<ActivityType>,
        target:Object as PropType<ActivityTarget>
    },
    emits:['onClick'],
    components:{...UI},
    setup(props,{emit}) {
        const api = useGameAPI();
        const availability = computed<ActivityAvailability>(()=>{
            return api.checkActivityAvailability(props.type!,props.target);
        });
        const activity = computed<Activity>(()=>{
            return api.getActivity(props.type!);
        });

        return {activity,availability,emit}
    },
})
</script>

<style lang="scss" scoped>
    .ui-flex.disabled{
        opacity:0.5;
    }
    .warn{
        color:$ui-danger;
        font-style:italic;
    }
</style>