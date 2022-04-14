<template >
  <div class="player-map" ref="mapHolder">
    <canvas ref="canvasRef" id="player-map"></canvas>
    <div class="fullscreen"></div>
  </div>
  <span v-if="picker">fuuu</span>
  <BuildingPicker
    v-if="picker"
    @onClose="showStructurePicker(false)"
    :structures="availableStructures"
    :cell="cellSelected"
    @onSelect="buildStructure"
  />
</template>

<script lang="ts">
/*import {
  PlayerMapController,
  PlayerMapEvents,
} from "@/game/controllers/playerMapController";*/
import {
  PlayerMapController,
  PlayerMapEvents,
} from "@/game/controllers/playerMapController";
import { CellInstance, Activity, ActivityType, Placeable } from "shared/monolyth";
import {
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import { useGameAPI } from "../services/gameApi";
import BuildingPicker from "../components/game/BuildingPicker.vue";
import { useStore } from "@/store";
import { CellIPTarget, InfopanelTarget, IPActionCallback } from "../classes/info";
import { closeInfoPanel, showInfoPanel2 } from '../controllers/ui';
import { BuildingActivityTarget } from "../classes/activities";

export default defineComponent({
  components: { BuildingPicker },
  setup() {
    const mapHolder = ref<HTMLElement | null>(null);
    const picker = ref(false);
    const canvasRef = ref<HTMLCanvasElement | null>(null); // brujería!?
    const cellSelected = ref<CellInstance|null>(null);

    const api = useGameAPI();
    const gameData = api.getGameData();

    let pmc:PlayerMapController;

    /**
     * Al final todo se reduce a construir esto
     */
    const buildStructure: (placeable:Placeable) => void = async (placeable:Placeable) => {
      showStructurePicker(false);
      const id = await api.startActivity(ActivityType.Build,new BuildingActivityTarget(cellSelected.value!.id,placeable.id));
      showInfoPanel2(new CellIPTarget(cellSelected.value!,activityHandler));
    };

    const availableStructures = ref<Placeable[]>([]);

    const showStructurePicker: (value:boolean) => void = (value:boolean)=> {
      closeInfoPanel();
      picker.value = value;
    }

    const activityHandler:IPActionCallback = (action:string) =>{
      if(action == CellIPTarget.ACTION_BUILD){
        
        const cellDef = gameData.cells[cellSelected.value!.cellId];

        availableStructures.value = cellDef.allowedPlaceableIds.map( id => api.getPlaceable(id));
        showStructurePicker(true);
      }
    }

    const onCellSelected: (cell: CellInstance) => void = (cell) => {
      cellSelected.value = cell;
      showInfoPanel2(new CellIPTarget(cellSelected.value!,activityHandler));
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

      pmc = new PlayerMapController(canvas, api);

      pmc.on(PlayerMapEvents.CELL_SELECTED, onCellSelected);
      window.addEventListener("resize", onResizeCanvas);

      onResizeCanvas();
    });

    onUnmounted(() => {
      closeInfoPanel();
      console.log('Destruyendo vista de área del jugador');
      pmc.destroy();
      window.removeEventListener("resize",onResizeCanvas);
    })

    return {
      picker,
      canvasRef,
      mapHolder,
      availableStructures,
      showStructurePicker,
      buildStructure,
      cellSelected
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