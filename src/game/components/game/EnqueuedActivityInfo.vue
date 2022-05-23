<template>
    <UIFlex gap="10" >
        <UILabel class="bold" :class="{disabled:!started}">{{data.name}}</UILabel>
        <UIFlex direction="row" justifyContent="space-between" alignItems="center">
            <UIFlex gap="5">
                <UILabel :class="{disabled:!started}">{{data.startedAt !==undefined ?'En progreso':'En espera'}}</UILabel>
                <UILabel :class="{disabled:!started}">{{eta}}</UILabel>
            </UIFlex>
            <UIButton :borderless="true" @onClick="cancelActivity">
                <UIIcon :src="deleteIcon" size="medium" />
                <UILabel>Cancelar</UILabel>
            </UIButton>
        </UIFlex>
    </UIFlex>    
</template>

<script lang="ts">
import { EnqueuedActivity, Media } from 'server/monolyth';
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref } from 'vue'
import {deleteIcon} from '../ui/icons';
import UILabel from '../ui/UILabel.vue';
import UIFlex from '../ui/UIFlex.vue';
import UIButton from '../ui/UIButton.vue';
import UIIcon from '../ui/UIIcon.vue';
import { countdown, countdownStr } from 'server/functions';
import { GameEvents, useGameAPI } from '@/game/services/gameApi';

export default defineComponent({
    props:{
        data:Object as PropType<EnqueuedActivity>
    },
    components:{UILabel,UIFlex,UIButton,UIIcon},
    setup(props) {
        const api = useGameAPI();
        const apiChanged = ref<number>(Date.now());
        const cancelActivity = async ()=>{
            if(props.data!.id){
                await api.cancelActivity(props.data!.id);
            }  
        }
        const apiHandler = ()=>{
            apiChanged.value = Date.now();
        }

        const eta = computed<string|undefined>( () => {
            apiChanged.value;
            const now = Date.now();
            return countdownStr(countdown(now,now+(props.data!.remaining||0)),false);
        });

        const started = computed<boolean>(()=>{
            apiChanged.value;
            return props.data!.startedAt !== undefined && props.data!.startedAt >= 0;
        })

        onMounted(()=>{
            api.on(GameEvents.Timer,apiHandler);
        });
        onUnmounted(()=>{
            api.off(GameEvents.Timer,apiHandler);
        })
        return {deleteIcon,eta,started,cancelActivity}
    },
})
</script>

<style lang="scss" scoped>
    .ui-label.disabled{
        color:$ui-control-font-color-disabled;
    }
</style>