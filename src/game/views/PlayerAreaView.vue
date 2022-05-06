<template >
  <div class="player-map" ref="mapHolder">
    <canvas ref="canvasRef" id="player-map"></canvas>
    <div class="fullscreen"></div>
  </div>
</template>

<script lang="ts">
import {
  PlayerMapController,
  PlayerMapEvents,
} from "@/game/controllers/playerMapController";
import { CellInstance } from "@/shared/monolyth";
import { defineComponent, onMounted, onUnmounted, ref } from "vue";
import { useGameAPI } from "../services/gameApi";
import { CellIPTarget } from "../classes/info";
import { closeInfoPanel, showInfoPanel2 } from "../controllers/ui";

export default defineComponent({
  components: {},
  setup() {
    
    const mapHolder = ref<HTMLElement | null>(null);

    const canvasRef = ref<HTMLCanvasElement | null>(null); // brujería!?
    const cellSelected = ref<CellInstance | null>(null);
    const api = useGameAPI();

    let pmc: PlayerMapController;

    const onCellSelected: (cell: CellInstance) => void = (cell) => {
      cellSelected.value = cell;
      showInfoPanel2(new CellIPTarget(cellSelected.value!));
    };

    const onResizeCanvas: () => void = () => {
      if (canvasRef.value != null && mapHolder.value != null) {
        canvasRef.value.width = mapHolder.value.clientWidth;
        canvasRef.value.height = mapHolder.value.clientHeight;
      }
    };

    onMounted(() => {
      const canvas: HTMLCanvasElement = document.getElementById(
        "player-map"
      ) as HTMLCanvasElement;

      pmc = new PlayerMapController(canvas, api);

      pmc.on(PlayerMapEvents.CELL_SELECTED, onCellSelected);
      window.addEventListener("resize", onResizeCanvas);

      onResizeCanvas();
    });

    onUnmounted(() => {
      closeInfoPanel();
      console.log("Destruyendo vista de área del jugador");
      pmc.destroy();
      window.removeEventListener("resize", onResizeCanvas);
    });

    return {
      canvasRef,
      mapHolder,
      cellSelected,
    };
  },
});
</script>



<style lang="scss" scoped>
.player-map {
  position: fixed;
  top: 0;
  width: 100%;
  height: 100%;
}
</style>