<template>
  <div class="notification-panel">
    <UIFlex gap="20" padding="10">
      <UIPane v-for="(notification,index) in notifications" :key="index" :class="`notification-${index}`">
        <UIFlex gap="5" padding="5" class="ml-10">
          <UIFlex direction="row" alignItems="center" justifyContent="space-between">
            <UILabel class="bold" :link="notification.callback != undefined" @onClick="navigate(notification)">{{notification.title}}</UILabel>
            <UIButton borderless @onClick="discard(notification)"><UIIcon :src="closeIcon" size="medium" /></UIButton>
          </UIFlex>
          <UIFlex direction="row" gap="10" justifyContent="flex-start" alignItems="center">
            <UIIcon v-if="notification.icon" :src="notification.icon" class="notification-icon"/>
            <p>{{notification.message}}</p>
          </UIFlex>
        </UIFlex>
      </UIPane>
    </UIFlex>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted } from "@vue/runtime-core";
import {closeIcon,timeIcon} from "../ui/icons"
import * as UI from "../ui/";
import { GameEvents, useGameAPI } from "@/game/services/gameApi";
import { ref } from "vue";
import { ActivityType, EnqueuedActivity, Message, MessageType, PlaceableInstance } from "server/monolyth";
import { AssetManager, ConstantAssets } from "server/assets";
import { showInfoPanel2 } from "@/game/controllers/ui";
import { CellIPTarget, ExistingPlaceableIPTarget, MessageIPTarget, TechIPTarget } from "@/game/classes/info";
import { BuildingActivityTarget, ExplorationActivityTarget, ResearchActivityTarget } from "@/game/classes/activities";

interface SystemNotification{
    id:number;
    icon?:string;
    message:string;
    title:string;
    callback?():void;
}
export default defineComponent({
  components: {
    ...UI,
  },

  setup() {
    let nextNotificationId = 0;

    const MAX_NOTIFICATIONS = 3;
    const api = useGameAPI();
    const gameData = api.getGameData();
    const apiChanged = ref<number>(Date.now());
    const notifications = ref<SystemNotification[]>([]);

    const addNotification = (notification:SystemNotification) => {
        if(notifications.value.length == MAX_NOTIFICATIONS){
            notifications.value = notifications.value.slice(1);
        }
        notifications.value.push(notification);
    }
    const discard = (notification:SystemNotification) => {
        notifications.value = notifications.value.filter( n => n.id != notification.id);
    }

    const navigate = (notification:SystemNotification) => {
        discard(notification);
        if(notification.callback){
            notification.callback();
        }
    }

    const notifyResearchCompleted = (target:ResearchActivityTarget) => {
        const technology = gameData.technologies[target.techId];

        const callback = ()=> {   
            showInfoPanel2(new TechIPTarget(technology));
        };

        const title = 'Actividad completada';
        const icon = AssetManager.get(technology.media.icon.id).url;
        const message = 'Se ha completdo la investigación de '+technology.media.name;
        addNotification({id:nextNotificationId++,title,icon,message,callback});
    }
    const notifyBuildingCompleted = (target:BuildingActivityTarget) => {
        const cellInstance = api.getCellInstance(target.cellInstanceId)!;
        const pInstance = cellInstance.placeables.find(pi => pi.id == target.placeableInstanceId)!;
        const placeable = gameData.placeables[pInstance.placeableId];
        const callback = ()=> {   
            showInfoPanel2(new ExistingPlaceableIPTarget(cellInstance,pInstance));
        };

        const title = 'Actividad completada';
        const icon = AssetManager.get(placeable.media.icon.id).url;
        const message = 'Se ha completado la construcción de '+placeable.media.name;
        addNotification({id:nextNotificationId++,title,icon,message,callback});
    }

    const notifyExplorationFinished = (target : ExplorationActivityTarget) => {
        const cellInstance = api.getCellInstance(target.cellInstanceId)!;
        const cell = gameData.cells[cellInstance.cellId];
        const callback = ()=> {   
            showInfoPanel2(new CellIPTarget(cellInstance));
        };

        const title = 'Actividad completada';
        const icon = AssetManager.get(cell.media.icon.id).url;
        const message = 'Se ha completado una misión de exploración';
        addNotification({id:nextNotificationId++,title,icon,message,callback});
    }

    const activityCanceledHandler = (ea:EnqueuedActivity) => {
        addNotification({id:nextNotificationId++,title:'Se ha cancelado la actividad '+ea.name,message:'Se han recuperado los recursos invertidos'});
    }

    const activityFinishedHandler = (ea:EnqueuedActivity) => {
        let title = '';
        let icon = '';

        if(ea.type == ActivityType.Research){
            notifyResearchCompleted(ea.target as ResearchActivityTarget);
        }else if(ea.type == ActivityType.Build){
            notifyBuildingCompleted(ea.target as BuildingActivityTarget);
        }else if(ea.type == ActivityType.Explore){
            notifyExplorationFinished(ea.target as ExplorationActivityTarget);
        }
    }
    const incomingMessageHandler = (message:Message) => {
        let title = '';
        let icon = '';
        const callback = ()=> {
            showInfoPanel2(new MessageIPTarget(message));
        };
        if(message.type == MessageType.Message){
            title = 'Mensaje de un jugador';
            icon = AssetManager.get(ConstantAssets.ICON_MSG_MESSAGE).url;
        }else if(message.type == MessageType.Notification){
            title = 'Evento';
            icon = AssetManager.get(ConstantAssets.ICON_MSG_NOTIFICATION).url;
        }else if(message.type == MessageType.Report){
            title = 'Informe de misión entrante';
            icon = AssetManager.get(ConstantAssets.ICON_MSG_REPORT).url;
        }

        addNotification({id:nextNotificationId++,title,icon,message:message.subject,callback});
    }
    
    const placeableCompletedHandler = (pInstance:PlaceableInstance) => {
        console.log(pInstance);
    }
    onMounted(()=>{
        api.on(GameEvents.IncomingMessage,incomingMessageHandler);
        api.on(GameEvents.ActivityFinished,activityFinishedHandler);
        api.on(GameEvents.ActivityCanceled,activityCanceledHandler);
        
    });
    onUnmounted(()=>{
        api.off(GameEvents.IncomingMessage,incomingMessageHandler);
        api.off(GameEvents.ActivityFinished,activityFinishedHandler);
        api.off(GameEvents.ActivityCanceled,activityCanceledHandler);
    });

    (window as any).addNotification = addNotification;
    return {closeIcon,notifications,discard,navigate};
  },
});
</script>

<style lang="scss" scoped>
.notification-panel {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 100%;
  z-index: 1000;

  .ui-pane{
      background-color: $ui-control-foreground-color;
      border:1px solid $ui-control-border-color;
      border-radius: $ui-control-border-radius;
      box-shadow: 3px 3px 3px $ui-control-shadow-color;
  }
  .notification-icon{
      @include invisible;
  }
  p{
      margin:0px;
      padding:0px 0px 10px 0px;
  }
}
</style>