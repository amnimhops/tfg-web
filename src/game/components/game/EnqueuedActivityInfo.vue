<template>
    <UIFlex gap="10">
        <UILabel class="bold">{{data.activity.name}}</UILabel>
        <UIFlex direction="row" justifyContent="space-between" alignItems="center">
            <UIFlex gap="5">
                <UILabel>{{data.activity.startedAt !==undefined ?'En progreso':'En espera'}}</UILabel>
                <UILabel>{{eta}}</UILabel>
            </UIFlex>
            <UIButton :borderless="true" @onClick="cancelActivity">
                <UIIcon :src="deleteIcon" size="medium" />
                <UILabel>Cancelar</UILabel>
            </UIButton>
        </UIFlex>
    </UIFlex>    
</template>

<script lang="ts">
import { EnqueuedActivity, Media } from 'shared/monolyth';
import { computed, defineComponent, PropType } from 'vue'
import {deleteIcon} from '../ui/icons';
import UILabel from '../ui/UILabel.vue';
import UIFlex from '../ui/UIFlex.vue';
import UIButton from '../ui/UIButton.vue';
import UIIcon from '../ui/UIIcon.vue';
import { countdown, countdownStr } from 'shared/functions';
import { useGameAPI } from '@/game/services/gameApi';
export interface EnqueuedActivityInfoModel{
    activity:EnqueuedActivity;
    media:Media;
}
export default defineComponent({
    props:{
        data:Object as PropType<EnqueuedActivityInfoModel>
    },
    components:{UILabel,UIFlex,UIButton,UIIcon},
    setup(props) {
        const api = useGameAPI();

        const cancelActivity = async ()=>{
            if(props.data?.activity.id){
                await api.cancelActivity(props.data?.activity.id);
            }
            
        }

        const eta = computed<string|undefined>( () => {
            const now = Date.now();
            return countdownStr(countdown(now,now+(props.data?.activity.remaining||0)),false);
        });
        return {deleteIcon,eta,cancelActivity}
    },
})
</script>

<style>

</style>