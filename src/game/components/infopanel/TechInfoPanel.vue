<template>
    <ErrorPanel v-if="error" :message="error" @onClose="error=null"/>
    <ActivityConfirmation 
        v-if="activityConfirmationModel" 
        :model="activityConfirmationModel" 
        @onCancel="closeActivityConfirmationDialog" 
        @onAccept="startResearch"
    />

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
import ActivityConfirmation from '../game/ActivityConfirmation.vue'
import { ActivityConfirmationModel, ResearchActivityTarget, useActivityConfirmation } from '@/game/classes/activities';
import { TechIPTarget } from '@/game/classes/info';
import { GameEvents, useGameAPI } from '@/game/services/gameApi';
import { Activity, ActivityType, Technology } from 'shared/monolyth';
import { computed, defineComponent, onUnmounted, PropType, ref } from 'vue'
import ErrorPanel from '../game/ErrorPanel.vue';
import { useRouter } from 'vue-router';
import {acceptIcon,closeIcon} from '../ui/icons'
import EnqueuedActivityInfo,{ EnqueuedActivityInfoModel } from '../game/EnqueuedActivityInfo.vue';

export default defineComponent({
    props:{
        target:Object as PropType<TechIPTarget>
    },
    components:{...UI,EnqueuedActivityInfo,ActivityConfirmation,ErrorPanel},
    setup(props) {
        const api = useGameAPI();
        const apiChanged = ref<number>(Date.now());
        const error = ref<string|undefined>();
        const gameData = api.getGameData();
        const router = useRouter();
        const activityType = ActivityType.Research;
        const activity = api.getActivity(activityType);
        const {activityConfirmationModel,openActivityConfirmationDialog,closeActivityConfirmationDialog} = useActivityConfirmation();
        const research = () => {
            openActivityConfirmationDialog('Comenzar investigación',ActivityType.Research,{
                name:props.target?.media?.name,
                tech:props.target?.tech
            } as ResearchActivityTarget);
        }
        //const activityConfirmationModel = ref<ActivityConfirmationModel|null>();
        // const openActivityConfirmationDialog = /*(title:string,type:ActivityType,target:ActivityTarget)*/ () => {
        //     activityConfirmationModel.value = {
        //         title:'Comenzar investigación',
        //         activityInfo:{
        //             type:ActivityType.Research,
        //             target:{
        //                 tech:props.target!.tech,
        //                 name:props.target!.tech.media.name
        //             } as ResearchActivityTarget
        //         }
        //     };
        // }

        // const closeActivityConfirmationDialog = () => {
        //     activityConfirmationModel.value = null;
        // }

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
        
        const inResearch = computed<EnqueuedActivityInfoModel|null>( () => {
            apiChanged.value;

            const activity = api.getQueueByType(ActivityType.Research).find( activity => {
                const target = activity.target as ResearchActivityTarget;
                return target.tech.id == props.target?.tech.id;
            });

            if(activity) {
                return {
                    activity,
                    media:(activity.target as ResearchActivityTarget).tech.media
                };
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

        const researchActivity = computed<Activity|undefined>( ()=>{
            apiChanged.value;

            const activity = gameData.activities.get(ActivityType.Research);
            console.log(activity);
            return activity;
        });
        
        const startResearch = async ()=>{
            try{
                closeActivityConfirmationDialog();

                const researchTarget:ResearchActivityTarget = {
                    tech:props.target!.tech,
                    name:props.target!.tech.media.name
                };
                await api.startActivity(ActivityType.Research,researchTarget);
            }catch(err){
                console.error(err);
                error.value = err as string;
            }
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
       
        return {
            researchActivity,researched,inResearch,
            acceptIcon,closeIcon,
            startResearch,unlockedTechs,requiredTech,navigate,
            activityConfirmationModel,research,closeActivityConfirmationDialog,
            error
        };
    },
})
</script>


<style>

</style>