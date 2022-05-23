<template>
  <div class="activity-view">
      <UIPane :style="{ backgroundImage: 'url('+bgImage+')' }">
        
        <UIFlex padding="10" gap="10">
            <UILabel class="extra-large mt-10 mb-10">Actividades en cola</UILabel>
            <UIFlex class="queues" gap="10">
                <UIFlex direction="row" class="activity" v-for="(summary,index) in summaries" :key="index" :class="{started:summary.started}" alignItems="center" justifyContent="space-between" :wrap="true">
                    <UIFlex direction="row" alignItems="center" gap="10" class="xs-12 lg-3">
                        <UIIcon :src="summary.activity.media.icon.url" size="medium" />
                        <UILabel link @onClick="viewDetails(summary)">{{summary.name}}</UILabel>
                    </UIFlex>
                    <UILabel class="xs-12 md-6 lg-2">
                        <span class="label-inprogress" v-if="summary.started">En progreso.</span>
                        <span class="label-inqueue" v-if="!summary.started">En cola.</span>
                    </UILabel>
                    <UILabel class="xs-12 md-6 lg-4">
                        <span> {{summary.started?'Termina':'Comienza'}} en </span>
                        <span class="label-countdown">{{summary.countdown}}</span>
                    </UILabel>
                    <UIFlex direction="row" gap="10" class="xs-12 lg-3" justifyContent="flex-end">
                        <UIButton @onClick="changePriority(summary,-1)" :disabled="summary.started"><UIIcon :src="caretUpIcon" size="medium" /></UIButton>
                        <UIButton @onClick="changePriority(summary,1)" :disabled="summary.started || index == summaries.length-1"><UIIcon :src="caretDownIcon" size="medium" /></UIButton>
                        <UIButton @onClick="cancel(summary)"><UIIcon :src="deleteIcon" size="medium" /></UIButton>
                    </UIFlex>
                </UIFlex>   
            </UIFlex>
        </UIFlex>
      </UIPane>
  </div>
</template>

<script lang="ts">
import * as UI from '../components/ui/';
import {deleteIcon,caretUpIcon,caretDownIcon} from '../components/ui/icons';
import { Activity, ActivityTarget, ActivityType } from 'server/monolyth';
import { computed, defineComponent, onMounted, ref } from 'vue'
import { GameEvents, useGameAPI } from '../services/gameApi'
import {countdown,countdownStr} from 'server/functions'
import { AssetManager, ConstantAssets } from 'server/assets';
import { showErrorPanel, showInfoPanel2 } from '../controllers/ui';
import { CellIPTarget, ExistingPlaceableIPTarget, InfopanelTarget, IPActionCallback, TechIPTarget } from '../classes/info';
import { BuildingActivityTarget, ResearchActivityTarget } from '../classes/activities';

interface ActivitySummary{
    id:number;
    name:string;
    activity:Activity;
    target:ActivityTarget;
    started:boolean;
    countdown:string;
}
export default defineComponent({
    components:{...UI},
    setup() {
        const api = useGameAPI();
        const gameData = api.getGameData();
        const apiChanged = ref<number>(Date.now());
        const bgImage = AssetManager.get(ConstantAssets.ACTIVITY_BACKGROUND).url;
        const summaries = computed<ActivitySummary[]>( ()=>{
            apiChanged.value;
            
            const enqueuedActivities = api.getQueue();
            const activityDetails:ActivitySummary[] = [];
           
            return enqueuedActivities.map( item => {
                const type = item.type
                const target = item.target;
                const activity = api.getActivity(type);
                
                return {
                    id:item.id,
                    name:item.name,
                    activity,
                    target,
                    countdown:countdownStr(countdown(Date.now(),Date.now()+(item.remaining||0))),
                    started:(item.startedAt||0) > 0
                } as ActivitySummary;
            });
        });

        const viewDetails = (summary:ActivitySummary) => {
            let ipTarget:InfopanelTarget|null = null;

            if(summary.activity.type == ActivityType.Research){
                const techId = (summary.target as ResearchActivityTarget).techId;
                const tech = gameData.technologies[techId];
                ipTarget = new TechIPTarget(tech);
                
                showInfoPanel2(ipTarget);
            }else if(summary.activity.type == ActivityType.Build){
                const activityTarget = summary.target as BuildingActivityTarget;
                const cellInstance = api.getCellInstance(activityTarget.cellInstanceId);
                const placeableInstance = cellInstance?.placeables.find( pi => pi.id == activityTarget.placeableInstanceId);
                if(cellInstance && placeableInstance){
                    ipTarget = new ExistingPlaceableIPTarget(cellInstance,placeableInstance);
                }
            }

            if(ipTarget) showInfoPanel2(ipTarget);

        }

        const changePriority = async(summary:ActivitySummary,offset:number) => {
            try{
                await api.changeActivityOrder(summary.id,offset);
            }catch(err){
                showErrorPanel(err as string);
            }
        }

        const cancel = async(summary:ActivitySummary) => {
            try{
                await api.cancelActivity(summary.id);
            }catch(err){
                showErrorPanel(err as string);
            }
        };

        onMounted(()=>{
            api.on(GameEvents.Timer,() => {
                apiChanged.value = Date.now();
            })
        });
        return {
            summaries,
            viewDetails,cancel,changePriority,
            bgImage,deleteIcon,caretUpIcon,caretDownIcon}
    },
})
</script>


<style lang="scss" scoped>
    .ui-pane{
        height:100vh;
        padding-top:105px;
        overflow-y: auto;
        background-size: cover;
        background-position:center center;
    }
    
    .activity{
        @include ui-control-rounded;
        background-color:$ui-control-foreground-color;
        padding:10px;
    }
    /* Este selector emula
     * el gap para los elementos
     * del flex que saltan de linea
     * por no disponer de espacio
     */
    .activity>*{
        padding:5px;
    }
    .label-inqueue{
        color:$ui-danger;
        font-weight:bold;
    }
    .label-inprogress{
        color:$ui-success;
        font-weight:bold;
    }
    .label-countdown{
        font-weight:bold;
    }
</style>