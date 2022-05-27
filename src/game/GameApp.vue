<template>
  <template v-if="resourcesLoaded">
    <!--<div class="veil">{{progress}}</div>-->
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
  <template v-else>
    <!-- En proceso de carga de recursos -->
    <div class="h-center">
      <div class="v-center">
        <div v-if="status.status=='loading'">
          <h2>{{status.message}}</h2>
          <div class="progress">
            <div class="bar" :style="{width:`${status.percent}`}">{{status.percent}}</div>
          </div>
        </div>
        <div v-else class="error-panel">
          <h2 class="error">Error al cargar</h2>
          <p>{{status.message}}</p>
          <router-link to="/" class="error-button">Volver</router-link>
        </div>
      </div>
    </div>

  </template>

</template>

<script lang="ts">

import InfoPanel from "@/game/components/infopanel/InfoPanel.vue";
import ResourcePanel from "@/game/components/game/ResourcePanel.vue";
import NavigationPanel from "@/game/components/game/NavigationPanel.vue";
import NotificationPanel from "@/game/components/game/NotificationPanel.vue";
import ErrorPanel from "@/game/components/game/ErrorPanel.vue";

import {AssetManager} from "server/assets";
import { Loader, Resource } from "resource-loader";

import { useStore } from '@/store';
import { defineComponent, onMounted, ref } from "@vue/runtime-core";
import { GameEvents, useGameAPI } from "./services/gameApi";
import { InfopanelTarget } from "./classes/info";
import { Asset, Stockpile } from "server/monolyth";
import { computed } from "vue";
import { closeInfoPanel, showErrorPanel } from "./controllers/ui";
import UIModal from './components/ui/UIModal.vue'
import { router } from "@/router";

interface LoadStatus{
  status:'loading'|'error';
  message:string
  percent:string;
}
export default defineComponent({
  components:{ResourcePanel,InfoPanel,NavigationPanel,ErrorPanel,NotificationPanel},
  setup() {
    const store = useStore();
    const resourcesLoaded = ref(false);
    const api = useGameAPI();
    const status = ref<LoadStatus>({status:'loading',message:'Cargando...',percent:'0%'});

    // TODO Quitar esto para producción
    (window as any).api = api;
    (window as any).closeInfoPanel = closeInfoPanel;
    
    onMounted( async () => {
      try{
        console.log('Enviando petición join() a juego',store.state.gameId);

        const assets = await api.joinGame(store.state.gameId!);
        console.log(assets);
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
          console.log(resource.url)
          status.value.percent = loader.progress.toFixed(2) + "%";
        });
          
        addCss(assets.find( asset => asset.type == "style"));
        loader.load( (loader, resources) => {
            for (let id in resources) {
              // Agregar el contenido a cada definición de asset
              AssetManager.get(id).data = resources[id]!.data; 
              console.log("Added", id,resources[id]!.url);
            }
            resourcesLoaded.value = true;
        });
      }catch(err){
        const msg = (err as Error).message;
        status.value.status = 'error';
        status.value.message = 'Error durante la carga: '+msg;
        console.log(status);
      }

        
    });

    const addCss = (file:Asset|undefined)=>{
      if(file){
        const fileref = document.createElement("link");
        fileref.rel = "stylesheet";
        fileref.type = "text/css";
        console.log(fileref.type);
        fileref.href = file.url;
        
        document.getElementsByTagName("head")[0].appendChild(fileref)
      }
      
    }
    
    
    return {resourcesLoaded,status}
  },
})
</script>

<style lang="scss">
/* Estilos generales sacados de _variables para no compartirlos con SiteApp */
  
input,select,textarea{
    font-family:var(--ui-control-font-family);
}
    
/* Se elimina la especificidad de los inputs, ya que contamina a WebSiteApp, COMPROBAR!*/
/*input[type=search],input[type=text],input[type=number],input[type=password]{*/
input{
    height:50px;
    border-radius: var(--ui-control-border-radius);
    padding-left:15px;
}

textarea{
    border-radius: var(--ui-control-border-radius);
    padding-left:15px;
    padding-top:10px;
}

.bold{
    font-weight:bold;
}
.h-center{
  position:absolute;
  display:flex;
  flex-flow:row nowrap;
  align-items: center;
  justify-content: center;
  width:100vw;
  height:100vh;
  color:white;
}
.v-center{
  display:flex;
  flex-flow:column nowrap;
  align-items: center;
  justify-content: center;
  gap:25px;
  height:100vh;
  width:75%;
  >div{
    display:flex;
    flex-flow:column nowrap;
    gap:15px;
    width:100%;
  }
}
h2{
  font-size:1.5em;
}
.progress{
  border:1px solid white;
  border-radius:5px;
  min-height:1em;
  width:100%;
}
.bar{
  height:100%;
  padding:5px;
  text-align:right;
  font-weight:bold;
  background:linear-gradient(to bottom, green 0%, black 100%);
}

.error-button{
  background-color:$site-primary-color;
  border-radius:5px;
  padding:10px;
  color:black;
  width:200px;
  margin-left:auto;
  margin-right:auto;
  text-align: center;
  text-decoration:none;
  font-weight: bold;
}
</style>
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
