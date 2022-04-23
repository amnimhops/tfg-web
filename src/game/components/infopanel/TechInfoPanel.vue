<template>
    <!-- En curso -->
    <UISection title="Investigando" class="ml-10" v-if="inResearch">
        <UIFlex padding="10">
            <UILabel >Investigando {{inResearch.media.name}} en {{inResearch.remaining}}</UILabel>
        </UIFlex>
    </UISection>
    <!-- Más datos -->
    <UISection title="Desbloquea" class="ml-10" v-if="unlockedTechs.length > 0">
        <UIFlex padding="10" gap="5">
            <UIFlex direction="row" v-for="(tech,index) in unlockedTechs" :key="index" alignItems="center" gap="15">
                <UIIcon :src="tech.media.icon.url" size="large" />
                <UILabel @onClick="navigate(tech)" :link="true">{{tech.id}}</UILabel>
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
    <!-- Tecnología no investigada -->
    <UISection title="Actividades" class="ml-10" v-if="!researched && !inResearch">
        <UIFlex padding="10" gap="5">
            <UIButton :borderless="true" grow @onClick="research">
                <UIIcon :src="researchActivity.media.icon.url" size="large" />
                <UILabel>{{researchActivity.media.name}}</UILabel>
            </UIButton>
        </UIFlex>
    </UISection>
</template>

<script lang="ts">
import * as UI from '../ui/';
import ResourceFlowItem from '../game/ResourceFlowItem.vue'
import { ResearchActivityTarget } from '@/game/classes/activities';
import { TechIPTarget } from '@/game/classes/info';
import { GameEvents, useGameAPI } from '@/game/services/gameApi';
import { ActivityType, Media, Technology } from 'shared/monolyth';
import { computed, defineComponent, onUnmounted, PropType, ref } from 'vue'
import { showInfoPanel2 } from '@/game/controllers/ui';
import { useRoute, useRouter } from 'vue-router';

interface TechInQueue{
    remaining?:string;
    media:Media;
}
export default defineComponent({
    props:{
        target:Object as PropType<TechIPTarget>
    },
    components:{...UI},
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

        const researched = computed<boolean|null>( () => {
            apiChanged.value; 
            console.log('investigado',api.getResearchedTechnologies().some( tech=> tech.id == props.target?.tech.id));
            return api.getResearchedTechnologies().some( tech=> tech.id == props.target?.tech.id);
        });
        const inResearch = computed<TechInQueue|null>( () => {
            apiChanged.value;

            const activity = api.getQueueByType(ActivityType.Research).find( activity => {
                const target = activity.target as ResearchActivityTarget;
                return target.tech.id == props.target?.tech.id;
            });

            if(activity) {
                return {
                    media:(activity.target as ResearchActivityTarget).tech.media,
                    remaining:activity.remaining
                } as TechInQueue
            }else{
                return null;
            }
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

        const researchActivity = gameData.activities.get(ActivityType.Research);
        
        const research = ()=>{
            showInfoPanel2(null);
            props.target?.actionCallback(TechIPTarget.ACTION_RESEARCH);
        };

        const navigate = (otherTech:Technology) => {
            //props.target?.actionCallback(TechIPTarget.ACTION_NAVIGATE,otherTech)
            router.push({name:'technology',params:{id:otherTech.id}});
        }

        onUnmounted( ()=>{
            // es MUY importante desconectar de la api al desmontar,
            // ya que este panel se crea y destruye múltiples veces
            api.off(GameEvents.Timer, handleApiChanges);
        })

        return {researchActivity,researched,inResearch,research,unlockedTechs,requiredTech,navigate};
    },
})
</script>


<style>

</style>