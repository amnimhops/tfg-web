<template >
  <div class="tech-map" ref="mapHolder">
    <!--<input type="search" class="tech-filter" v-model="techFilter" @change="applyFilter"/>-->
    <canvas ref="canvasRef" id="tech-map"></canvas>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from "vue";
import { TechTreeController, TechTreeEvents } from '@/game/controllers/techTreeController';
import { ActivityType, Technology } from "@/shared/monolyth";
import {acceptIcon,closeIcon} from '../components/ui/icons'
import { useGameAPI } from "../services/gameApi";
import { TechIPTarget } from "../classes/info";
import { showInfoPanel2 } from '../controllers/ui';
import { useRoute, useRouter } from "vue-router";

export default defineComponent({
  setup() {
    const router = useRouter();
    const route = useRoute();

    const techFilter = ref<string|undefined>();
    const mapHolder = ref<HTMLElement | null>(null);
    const canvasRef = ref<HTMLCanvasElement | null>(null); // brujería!?
    let treeController:TechTreeController|null = null;

    const api = useGameAPI();
    const gameData = api.getGameData();

    const onResizeCanvas: () => void = () => {
      console.log(canvasRef.value);
      if (canvasRef.value != null && mapHolder.value != null) {
        canvasRef.value.width = mapHolder.value.clientWidth;
        canvasRef.value.height = mapHolder.value.clientHeight;
      }
    };
    
    const showResearchConfirmDialog = ref<boolean>(false);
    const openResearchConfirmDialog = () => showResearchConfirmDialog.value = true;
    const closeResearchConfirmDialog = () => showResearchConfirmDialog.value = false
   
    const techSelected = ref<Technology|null>(null);

    const onTechSelected: (tech: Technology) => void = (tech) => {
      techSelected.value = tech;
      showInfoPanel2(new TechIPTarget(tech));
    };

    const researchActivity = api.getGameData().activities.get(ActivityType.Research);

    
    const technologyIdWatchStopper = watch( ()=> route.params.id, (newId)=>{
      const id = route.params.id as string;
      console.log('Recevied tech id',id);
      if(gameData.technologies[id] != null){
        treeController?.setSelected(gameData.technologies[id]);
      }
    });

    /**
     * Se establece un centinela ante el cambio de ruta
     * para que el watcher que controla la navegación interna
     * con el componente infopanel no explote al variar la url.
     * 
     * La misión del centinela es anular el watcher y proceder
     * normalmente con el cambio de vista
     */
    router.beforeEach( (to,from) => {
        if(to.name != from.name){
            technologyIdWatchStopper();
        }
    });  

    onMounted(() => {
      console.log('abriend')
      const canvas: HTMLCanvasElement = document.getElementById(
        "tech-map"
      ) as HTMLCanvasElement;

      treeController = new TechTreeController(canvas, api);

      treeController.on(TechTreeEvents.TECH_SELECTED, onTechSelected);
      window.addEventListener("resize", onResizeCanvas);

      onResizeCanvas();

       // Finalmente, si llega algo por la ruta, se selecciona la tecnología adecuada
      const routeId = route.params.id as string;
      if(routeId && gameData.technologies[routeId]){
        treeController.setSelected(gameData.technologies[routeId]);
      }
    });

    onUnmounted( () => {
      console.log('Cerrando vista de tecnologías');
      treeController?.destroy();
    });

    return {
      canvasRef,
      mapHolder,
      techSelected,
      //techFilter,applyFilter,
      //startResearch,
      researchActivity,
      acceptIcon,closeIcon,
      showResearchConfirmDialog,
      openResearchConfirmDialog,
      closeResearchConfirmDialog
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