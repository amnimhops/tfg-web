<template>
    <!-- Tecnología no investigada -->
    <!-- Se podría usar un ActivityButton, pero no hay más actividades -->
    <!-- de forma qe no se gana nada -->
    <UIFlex gap="20">
        <UIFlex padding="10" v-if="!researched && !inResearch">
            <ActivityButton 
                :type="researchActivity.type" 
                :target="researchActivity.target" 
                :title="'Iniciar '+researchActivity.target.name"
                @onStarted="returnHere"/>
        </UIFlex>
        <!-- En curso -->
        <UISection title="En cola" class="ml-10" v-if="inResearch">
            <UIFlex padding="10">
                <EnqueuedActivityInfo :data="inResearch" />
            </UIFlex>
        </UISection>
        <!-- Más datos -->
        <UISection title="Desbloquea" class="ml-10" v-if="unlockedTechs.length > 0">
            <UIFlex padding="10" gap="5">
                <UIFlex direction="row" v-for="(tech,index) in unlockedTechs" :key="index" alignItems="center" gap="15">
                    <UIIcon :src="tech.media.icon.url" size="large" />
                    <UILabel @onClick="navigate(tech)" :link="true">{{tech.media.name}}</UILabel>
                </UIFlex>
            </UIFlex>
        </UISection>
            <!-- Más datos -->
        <UISection title="Necesita" class="ml-10" v-if="requiredTech">
            <UIFlex direction="row" alignItems="center" gap="5" padding="10">
                <UIIcon :src="requiredTech.media.icon.url" size="large" />
                <UILabel @onClick="navigate(requiredTech)" :link="true">{{requiredTech.media.name}}</UILabel>
            </UIFlex>
        </UISection>
    </UIFlex>
</template>

<script lang="ts">
import * as UI from '../ui/';
import ActivityButton from '../game/ActivityButton.vue'
import { ActivityInfo, ResearchActivityTarget, useActivityConfirmation } from '@/game/classes/activities';
import { TechIPTarget } from '@/game/classes/info';
import { GameEvents, useGameAPI } from '@/game/services/gameApi';
import { Activity, ActivityType, EnqueuedActivity, Technology } from 'server/monolyth';
import { computed, defineComponent, onUnmounted, PropType, ref } from 'vue'
import { useRouter } from 'vue-router';
import {acceptIcon,closeIcon} from '../ui/icons'
import EnqueuedActivityInfo from '../game/EnqueuedActivityInfo.vue';
import { goBackInfoPanelHistory } from '@/game/controllers/ui';

export default defineComponent({
    props:{
        target:Object as PropType<TechIPTarget>
    },
    components:{...UI,EnqueuedActivityInfo,ActivityButton},
    setup(props) {
        const api = useGameAPI();
        const apiChanged = ref<number>(Date.now());
        const gameData = api.getGameData();
        const router = useRouter();
        
        const handleApiChanges = ()=>{
            console.log('api change detected')
            apiChanged.value = Date.now();
        }

        api.on(GameEvents.Timer, handleApiChanges);

        const returnHere = () => goBackInfoPanelHistory();

        const researched = computed<boolean|null>( () => {
            apiChanged.value; 
            console.log('investigado',api.getResearchedTechnologies().some( tech=> tech.id == props.target?.tech.id));
            return api.getResearchedTechnologies().some( tech=> tech.id == props.target?.tech.id);
        });
        
        const inResearch = computed<EnqueuedActivity|undefined>( () => {
            apiChanged.value;

            return api.getQueueByType(ActivityType.Research).find( activity => {
                const target = activity.target as ResearchActivityTarget;
                return target.techId == props.target?.tech.id;
            });
        });

        const unlockedTechs = computed<Technology[]>( () => {
            return props.target?.tech.unlocks.map( id => gameData.technologies[id]) || [];
        });
        const requiredTech = computed<Technology|null>( () => {
            if(props.target!.tech.parent){
                return gameData.technologies[props.target!.tech.parent!];
            }else{
                return null;
            }
            
        });

        const researchActivity = computed<ActivityInfo|undefined>( ()=>{
            apiChanged.value;

            return {
                type:ActivityType.Research,
                target:{
                    techId:props.target!.tech.id,
                    name:props.target!.tech.media.name
                }as ResearchActivityTarget
            }
        });

        const navigate = (otherTech:Technology) => {
            //props.target?.actionCallback(TechIPTarget.ACTION_NAVIGATE,otherTech)
            router.push({name:'technology',params:{id:otherTech.id}});
        }

        onUnmounted( ()=>{
            // es MUY importante desconectar de la api al desmontar,
            // ya que este panel se crea y destruye múltiples veces
            api.off(GameEvents.Timer, handleApiChanges);
        })
       
        return {
            researchActivity,researched,inResearch,
            acceptIcon,closeIcon,
            unlockedTechs,requiredTech,navigate,
            returnHere
        };
    },
})
</script>


<style>

</style>