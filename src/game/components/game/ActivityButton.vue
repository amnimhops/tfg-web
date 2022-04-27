<template>
    <template v-if="!availability.available">
         <UIFlex gap="10">
            <UISection>
                <UIFlex gap="10">
                    <UIFlex class="disabled" gap="10" padding="10" direction="row" alignItems="center">
                        <UIIcon :src="icon||activity.media.icon.url" size="large"/>
                        <UIFlex  gap="10">
                            <UILabel class="large bold">{{title||activity.media.name}}</UILabel>
                            <UILabel v-for="(cause,index) in availability.info" :key="index" class="warn" >{{cause}}</UILabel>
                        </UIFlex>
                    </UIFlex>
                </UIFlex>
            </UISection>
         </UIFlex>
    </template>
    <template v-else>
        <UIFlex gap="10">
            <UIFlex direction="row" gap="10" alignItems="center">
                <UIIcon :src="icon||activity.media.icon.url" size="large"/>
                <UILabel class="large bold" :link="titleClickable" @onClick="emit('onTitleClicked')">{{title||activity.media.name}}</UILabel>
            </UIFlex>
            <UISection>
                <UIFlex gap="10">
                    <UIFlex gap="10" class="ml-20">
                        <UIFlex direction="row" gap="10" alignItems="center">
                            <UIIcon :src="timeIcon" size="medium"/>
                            <UILabel>Duración {{cost.duration}}</UILabel>
                        </UIFlex>
                        <ResourceFlowItem v-for="(flow,index) in cost.resources" :key="index" :flow="flow" type="expense"/>
                    </UIFlex>
                    <UIFlex direction="row" alignItems="center" class="ml-20 mr-10">
                        <UIButton @onClick="start" grow :borderless="true" >
                            <UIIcon :src="activity.media.icon.url" size="medium" />
                            <span>Iniciar</span>
                        </UIButton>
                    </UIFlex>
                </UIFlex>
            </UISection>
        </UIFlex>
        <!--<UIButton @onClick="start" grow>
            <UIIcon :src="activity.media.icon.url" size="large" />
            <span>{{activity.media.name}}</span>
        </UIButton>-->
    </template>
</template>

<script lang="ts">
import * as UI from '../ui/';
import ResourceFlowItem from './ResourceFlowItem.vue'
import { ActivityAvailability } from '@/game/classes/activities'
import { ActivityCost, useGameAPI } from '@/game/services/gameApi'
import { Activity, ActivityTarget, ActivityType } from 'shared/monolyth'
import { computed, defineComponent, PropType } from 'vue'
import {timeIcon} from '../ui/icons'
import { showErrorPanel } from '@/game/controllers/ui';

export default defineComponent({
    props:{
        type:Number as PropType<ActivityType>,
        target:Object as PropType<ActivityTarget>,
        title:String,
        icon:String,
        titleClickable:Boolean
    },
    emits:['onStarted','onTitleClicked'],
    components:{...UI,ResourceFlowItem},
    setup(props,{emit}) {
        const api = useGameAPI();
        const cost = computed<ActivityCost>(()=>{
            const i= api.getActivityCost(props.type!,props.target);
                console.log(i);
            return i;
        });
        const availability = computed<ActivityAvailability>(()=>{
            console.log('Checking availability of',props.target);
            return api.checkActivityAvailability(props.type!,props.target);
        });
        const activity = computed<Activity>(()=>{
            return api.getActivity(props.type!);
        });
        //const costs = computed<ResourceAmount[]
        const start = async ()=>{
             try{
                await api.startActivity(props.type!,props.target!);
                console.log('Activity request send');
                emit('onStarted');
             }catch(err){
                console.log('Activity request error');
                showErrorPanel(err as string);
            }
        }

        return {timeIcon,activity,availability,cost,start,emit}
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