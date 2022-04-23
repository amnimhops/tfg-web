<template>
  <div class="world-view">
    <div class="world-map" ref="mapHolder">
      <canvas ref="canvasRef" id="world-map"></canvas>
    </div>
    <UIButton class="toggle-players" @onClick="togglePlayerList">
      <UIIcon :src="playersIcon" size="small" />
      {{playerListVisible?'Ocultar':'Mostrar'}}
    </UIButton>
    <UIPane class="nearby-players" :class="{visible:playerListVisible}">
      <UIFlex padding="10" gap="10">
        <UIFlex class="list-header" gap="10">
          <UILabel class="player-count large pt-15">Lista de jugadores</UILabel>
          <input type="search" name="q" v-model="playerFilter" />
        </UIFlex>
        <PlayerList class="mt-10" :players="filteredPlayers" @onPlayerSelected="onPlayerSelected"/>
      </UIFlex>
    </UIPane>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from "vue";
import * as UI from "../components/ui/";
import PlayerList from "../components/game/PlayerList.vue";
import { Player, Vector } from "shared/monolyth";
import {
  WorldMapEvents,
  WorldMapController,
} from "../controllers/worldMapController";
import { useGameAPI, WorldPlayer } from "../services/gameApi";
import { MAP_SIZE } from "shared/mocks";
import { AssetManager, ConstantAssets } from "../classes/assetManager";
import { showInfoPanel2 } from "../controllers/ui";
import { InstancePlayerIPTarget } from "../classes/info";

export default defineComponent({
  components: { ...UI, PlayerList },
  setup() {
    const playersIcon = AssetManager.get(ConstantAssets.ICON_PLAYERS).url;
    const api = useGameAPI();
    const apiChanged = ref<number>(Date.now());
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const mapHolder = ref<HTMLElement | null>(null);
    const playerFilter = ref<string>('');
    const playerListVisible = ref<boolean>(false);
    const players = ref<WorldPlayer[]>([]);
    const filteredPlayers = computed<WorldPlayer[]>( () => {
      const filter = (playerFilter.value || '').toLowerCase();
      return players.value.filter( p => p.media.name.toLowerCase().indexOf(filter) >= 0);
    });
    const playerCount = computed<string|undefined>( ()=>{
      const count = players.value?.length || 0;
      if(count) return count + 'jugadores encontrados';
      else return 'Ningún jugador cerca';
    });
    let wmc: WorldMapController | null = null;

    const togglePlayerList = () =>
      (playerListVisible.value = !playerListVisible.value);

    const onPlayersAvailable = (playerList: WorldPlayer[]) => {
      players.value = [];
      playerList.forEach((player) => players.value.push(player));
    };

    const onPlayerSelected = (player:WorldPlayer) => {
      // No será necesario traer los datos del jugador de la API ya
      // que están en la info del sector, así que podemos construir
      // un parcial de jugador suficiente.
      showInfoPanel2(new InstancePlayerIPTarget(player,()=>{
        console.log('wwiiii');
      }));
    }
    const onResizeCanvas: () => void = () => {
        if (canvasRef.value != null && mapHolder.value != null) {
            canvasRef.value.width = mapHolder.value.clientWidth;
            canvasRef.value.height = mapHolder.value.clientHeight;
        }
    };

    onMounted(() => {
      const canvas: HTMLCanvasElement = document.getElementById(
        "world-map"
      ) as HTMLCanvasElement;

      wmc = new WorldMapController(canvas,api);
      wmc.on(WorldMapEvents.PLAYERS_AVAILABLE, onPlayersAvailable);
      window.addEventListener("resize", onResizeCanvas);

      onResizeCanvas();

      // Finalmente, si llega algo por la ruta, se selecciona la tecnología adecuada
      // const routeId = route.params.id as string;
      // if(routeId && gameData.technologies[routeId]){
      //     treeController.setSelected(gameData.technologies[routeId]);
      // }
    });

    onUnmounted(() => {
      window.removeEventListener("resize", onResizeCanvas);
    });

    return {
      players,
      playerCount,
      filteredPlayers,
      playerFilter,
      playerListVisible,
      canvasRef,
      mapHolder,
      togglePlayerList,
      
      onPlayerSelected,
      playersIcon
    };
  },
});
</script>

<style lang="scss" scoped>
.world-view{
    height:100vh;
    padding-top:110px;
}
.toggle-players{
  position:fixed;
  top:120px;
  z-index: 3;
  right:10px;
}
.nearby-players {
  @include invisible;
  position:absolute;
  top:0px;
  padding-top:110px;
  width:100%;
  height:100vh;
  z-index:2;
  overflow-y:auto;
 
  &.visible{
    @include visible(block);
  }
}

.world-map {
    position: fixed;
    top: 110px;
    bottom:0px;
    width: 100%;
    
    z-index:1;
}

@media(min-width:1024px){
  .nearby-players {
    @include visible(block);
    padding-top:0;
    left:50%;
    width:50%;
    height:100%;
    position:relative;
    top:0px;
    z-index:2;
    overflow-y:auto;
  }
  .toggle-players{
    @include invisible;
  }
}
</style>