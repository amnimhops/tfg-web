<template>
    <UIButton @onClick="startHandler" borderless grow>
        <UIIcon :src="activity.media.icon.url" size="large" />
        <span>{{activity.media.name}}</span>
    </UIButton>
</template>

<script lang="ts">
import * as UI from '../ui/';
import { ActivityAvailability } from '@/game/classes/activities'
import { ActivityCost, useGameAPI } from '@/game/services/gameApi'
import { Activity, ActivityTarget, ActivityType } from 'shared/monolyth'
import { computed, defineComponent, PropType } from 'vue'
import { showErrorPanel, showInfoPanel2 } from '@/game/controllers/ui';
import { ActivityIPTarget } from '@/game/classes/info';

export default defineComponent({
    props:{
        type:Number as PropType<ActivityType>,
        target:Object as PropType<ActivityTarget>,
        handler:Object as PropType<(()=>void)>
    },
    emits:['onStarted'],
    components:{...UI},
    setup(props,{emit}) {
        const api = useGameAPI();
        // Establece si debe usar el manejador por defecto (panel info actividad) o uno personalizado
        const startHandler = computed<()=>void>(()=>{
            return props.handler || preStart
        })
        const availability = computed<ActivityAvailability>(()=>{
            console.log('Checking availability of',props.target);
            return api.checkActivityAvailability(props.type!,props.target);
        });
        const activity = computed<Activity>(()=>{
            return api.getActivity(props.type!);
        });
        //const costs = computed<ResourceAmount[]
        const preStart = async ()=>{
             showInfoPanel2(new ActivityIPTarget(props.type!,props.target!,()=>{
                 emit('onStarted');
             }));
        }

        return {activity,availability,startHandler}
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