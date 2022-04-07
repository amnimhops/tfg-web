<template >
  <div class="tech-map" ref="mapHolder">
    <canvas ref="canvasRef" id="tech-map"></canvas>
  </div>
</template>

<script lang="ts">
import {
  PlayerMapController,
  PlayerMapEvents,
} from "@/game/controllers/playerMapController";
import { CellInstance, Activity, ActivityType, Placeable } from "shared/monolyth";
import {
  defineComponent,
  onMounted,
  ref,
} from "vue";
import { useGameAPI } from "../services/gameApi";
import BuildingPicker from "../components/game/BuildingPicker.vue";
import { useStore } from "@/store";
import { buildCellInstanceTarget, CellIPTarget, InfopanelTarget, IPActionCallback } from "../classes/info";
import { AssetManager, ConstantAssets } from "../classes/assetManager";
import { showInfoPanel } from '../controllers/ui';
import { BuildingActivityTarget } from "../classes/activities";

export default defineComponent({
  components: { BuildingPicker },
  setup(props) {
    const mapHolder = ref<HTMLElement | null>(null);
    const picker = ref(false);
    const canvasRef = ref<HTMLCanvasElement | null>(null); // brujería!?
    const cellSelected = ref<CellInstance|null>(null);

    const api = useGameAPI();
    const store = useStore();

    /**
     * Al final todo se reduce a construir esto
     */
    const buildStructure: (placeable:Placeable) => void = async (placeable:Placeable) => {
      showStructurePicker(false);
      const id = await api.startActivity(ActivityType.Build,new BuildingActivityTarget(cellSelected.value!.id,placeable.id));
      console.log('Queue activity id is',id);
    };

    const availableStructures = ref<Placeable[]>([]);

    const showStructurePicker: (value:boolean) => void = (value:boolean)=> {
      console.log('Mostrando selector de estructuras',value);
      store.commit('panelSelection',[]); // Cierra el panel
      picker.value = value;
    }

    const activityHandler:IPActionCallback = (activity:Activity,target:InfopanelTarget) =>{
      console.log(activity,target);
      if(activity.type == ActivityType.Build){
        const api = useGameAPI();
        const cellTarget = target as CellIPTarget;
        const cellDef = api.getCell(cellTarget.cellInstance.cellId);

        availableStructures.value = cellDef.allowedPlaceableIds.map( id => api.getPlaceable(id));
        showStructurePicker(true);
      }
    }

    

    const onCellSelected: (cell: CellInstance) => void = (cell) => {
      cellSelected.value = cell;
      showInfoPanel(buildCellInstanceTarget(cell,activityHandler));
    };

    const onResizeCanvas: () => void = () => {
      console.log(canvasRef.value);
      if (canvasRef.value != null && mapHolder.value != null) {
        canvasRef.value.width = mapHolder.value.clientWidth;
        canvasRef.value.height = mapHolder.value.clientHeight;
      }
    };

    onMounted(() => {
      const canvas: HTMLCanvasElement = document.getElementById(
        "player-map"
      ) as HTMLCanvasElement;

      const pmc = new PlayerMapController(canvas, api);

      pmc.on(PlayerMapEvents.CELL_SELECTED, onCellSelected);
      window.addEventListener("resize", onResizeCanvas);

      onResizeCanvas();
    });

    return {
      picker,
      canvasRef,
      mapHolder,
      availableStructures,
      showStructurePicker,
      buildStructure,
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
canvas {
  background-color: red;
}
</style>