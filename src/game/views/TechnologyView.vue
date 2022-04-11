<template >
  <div class="tech-map" ref="mapHolder">
    <canvas ref="canvasRef" id="tech-map"></canvas>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import { TechTreeController, TechTreeEvents } from '@/game/controllers/techTreeController';
import { CellInstance, Activity, ActivityType, Placeable, Technology } from "shared/monolyth";

import { useGameAPI } from "../services/gameApi";
import { useStore } from "@/store";
import { buildCellInstanceTarget, CellIPTarget, InfopanelTarget, IPActionCallback, TechIPTarget } from "../classes/info";
import { AssetManager, ConstantAssets } from "../classes/assetManager";
import { showInfoPanel } from '../controllers/ui';
import { BuildingActivityTarget, ResearchActivityTarget } from "../classes/activities";

export default defineComponent({
  /*components: { BuildingPicker },*/
  setup(props) {
    const mapHolder = ref<HTMLElement | null>(null);
    const canvasRef = ref<HTMLCanvasElement | null>(null); // brujería!?

    const api = useGameAPI();
    const store = useStore();   

    const onResizeCanvas: () => void = () => {
      console.log(canvasRef.value);
      if (canvasRef.value != null && mapHolder.value != null) {
        canvasRef.value.width = mapHolder.value.clientWidth;
        canvasRef.value.height = mapHolder.value.clientHeight;
      }
    };

    const activityHandler:IPActionCallback = (activity:Activity,target:InfopanelTarget) =>{
      api.startActivity(ActivityType.Research,new ResearchActivityTarget( (target as TechIPTarget).tech));
    }
    const onTechSelected: (tech: Technology) => void = (tech) => {
      showInfoPanel([new TechIPTarget(tech,activityHandler)]);
    };

    onMounted(() => {
      console.log('abriend')
      const canvas: HTMLCanvasElement = document.getElementById(
        "tech-map"
      ) as HTMLCanvasElement;

      const pmc = new TechTreeController(canvas, api);

      pmc.on(TechTreeEvents.TECH_SELECTED, onTechSelected);
      window.addEventListener("resize", onResizeCanvas);

      onResizeCanvas();
    });

    onUnmounted( () => {
      console.log('chapando')
    });

    return {
      canvasRef,
      mapHolder,

    };
  },
});
</script>



<style lang="scss" scoped>
.tech-map {
  position: fixed;
  top: 0;
  width: 100%;
  height: 100%;
}
canvas {
  background-color: red;
}
</style>