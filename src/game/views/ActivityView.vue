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
                        <UIButton :disabled="summary.started || index == 1"><UIIcon :src="caretUpIcon" size="medium" /></UIButton>
                        <UIButton :disabled="summary.started || index == summaries.length-1"><UIIcon :src="caretDownIcon" size="medium" /></UIButton>
                        <UIButton><UIIcon :src="deleteIcon" size="medium" /></UIButton>
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
import { Activity, ActivityTarget, ActivityType } from 'shared/monolyth';
import { computed, defineComponent, onMounted, ref } from 'vue'
import { GameEvents, useGameAPI } from '../services/gameApi'
import {countdown,countdownStr} from 'shared/functions'
import { AssetManager, ConstantAssets } from '../classes/assetManager';
import { showInfoPanel2 } from '../controllers/ui';
import { CellIPTarget, ExistingPlaceableIPTarget, InfopanelTarget, IPActionCallback, TechIPTarget } from '../classes/info';
import { BuildingActivityTarget, ResearchActivityTarget } from '../classes/activities';

interface ActivitySummary{
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
        const apiChanged = ref<number>(Date.now());
        const bgImage = AssetManager.get(ConstantAssets.ACTIVITY_BACKGROUND).url;
        const summaries = computed<ActivitySummary[]>( ()=>{
            apiChanged.value;
            console.log('cosas')
            const enqueuedActivities = api.getQueue();
            const activityDetails:ActivitySummary[] = [];
           
            return enqueuedActivities.map( item => {
                const type = item.type
                const target = item.target;
                const activity = api.getActivity(type);
                
                return {
                    name:item.name,
                    activity,
                    target,
                    countdown:countdownStr(countdown(Date.now(),Date.now()+(item.remaining||0))),
                    started:(item.startedAt||0) > 0
                } as ActivitySummary;
            });
        });

        const actionHandler:IPActionCallback = (command:string,data:any) => {
            console.log(command,data);
        }

        const viewDetails = (summary:ActivitySummary) => {
            let ipTarget:InfopanelTarget|null = null;

            if(summary.activity.type == ActivityType.Research){
                ipTarget = new TechIPTarget((summary.target as ResearchActivityTarget).tech, actionHandler);
                showInfoPanel2(ipTarget);
            }else if(summary.activity.type == ActivityType.Build){
                const activityTarget = summary.target as BuildingActivityTarget;
                const cellInstance = api.getCellInstance(activityTarget.cellInstanceId);
                const placeableInstance = cellInstance?.placeables.find( pi => pi.id == activityTarget.placeableInstanceId);
                if(cellInstance && placeableInstance){
                    ipTarget = new ExistingPlaceableIPTarget(cellInstance,placeableInstance,actionHandler);
                }
            }

            if(ipTarget) showInfoPanel2(ipTarget);

        }
        onMounted(()=>{
            api.on(GameEvents.Timer,() => {
                apiChanged.value = Date.now();
            })
        });
        return {
            summaries,
            viewDetails,
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