<template>
  <template v-if="resourcesLoaded">
    
    <div class="header">
      <NavigationPanel />
      <ResourcePanel />
    </div>
    <div id="current-view" class="current-view" ref="playerMap">
      <router-view></router-view>
    </div>
    <InfoPanel />
    <ErrorPanel/>
    <NotificationPanel />
    
  </template>
</template>

<script lang="ts">

import InfoPanel from "@/game/components/infopanel/InfoPanel.vue";
import ResourcePanel from "@/game/components/game/ResourcePanel.vue";
import NavigationPanel from "@/game/components/game/NavigationPanel.vue";
import NotificationPanel from "@/game/components/game/NotificationPanel.vue";
import ErrorPanel from "@/game/components/game/ErrorPanel.vue";
import {AssetManager} from "@/game/classes/assetManager";
import { Loader, Resource } from "resource-loader";

import { useStore } from '@/store';
import { defineComponent, onMounted, ref } from "@vue/runtime-core";
import { GameEvents, useGameAPI } from "./services/gameApi";
import { InfopanelTarget } from "./classes/info";
import { Stockpile } from "@/shared/monolyth";
import { computed } from "vue";
import { closeInfoPanel } from "./controllers/ui";
import UIModal from './components/ui/UIModal.vue'
export default defineComponent({
  components:{ResourcePanel,InfoPanel,NavigationPanel,ErrorPanel,NotificationPanel},
  setup() {
    const store = useStore();
    const resourcesLoaded = ref(false);
    const api = useGameAPI();
    // TODO Quitar esto para producción
    (window as any).api = api;
    (window as any).closeInfoPanel = closeInfoPanel;
    onMounted( async () => {
      const player = await api.authenticate("fu","bar");
      const assets = await api.joinGame("TODO_GAMEID_HERE");
      
      
      // Agregar el asset al manager, con el contenido inicialmente vacio
      assets.forEach((asset) => AssetManager.add(asset));
      // Instancia del cargador 
      const loader = new Loader();
      // Agregar asset al cargador
      assets.forEach((asset) => loader.add(asset.id, asset.url));
      // Cruzar dedos y cargar
      let loaded = 0;
      loader.onProgress.add( (loader: Loader, resource: Resource)=>{
        console.log(loaded++,'de',assets.length);
      });
        
      loader.load( (loader, resources) => {
          for (let id in resources) {
            // Agregar el contenido a cada definición de asset
            AssetManager.get(id).data = resources[id]!.data; 
            console.log("Added", id);
          }
          resourcesLoaded.value = true;
      });

        
    });
    
    return {resourcesLoaded}
  },
})
</script>

<style lang="scss" scoped >


*{
  box-sizing: border-box;
  -moz-user-select: none; -webkit-user-select: none; -ms-user-select:none; user-select:none;-o-user-select:none;
}

body{
  margin:0px;
  padding:0px;
  
}
.header{
  position:fixed;
  z-index:1;
  top:0px;
  width:100%;
}
.current-view {
  background-color:yellow;
  position:fixed;
  top:0;
  left:0;
  width:100%;
  height:100%;
  z-index:0;
}

</style>