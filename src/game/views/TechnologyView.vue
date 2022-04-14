<template >
  <div class="tech-map" ref="mapHolder">
    <canvas ref="canvasRef" id="tech-map"></canvas>
  </div>
  <!-- Modal de confirmación -->
  <UIModal v-if="showResearchConfirmDialog" title="Comenzar investigación" @onClose="closeResearchConfirmDialog">
    <template v-slot:content>
      <UISection title="Coste de investigación" class="ml-10">
        <UIFlex padding="10" gap="10">
          <ResourceFlowItem v-for="(flow,index) in researchActivity.flows" :key="index" :flow="flow"/>
          <ResourceFlowItem v-for="(flow,index) in researchActivity.flows" :key="index" :flow="flow"/>
          <ResourceFlowItem v-for="(flow,index) in researchActivity.flows" :key="index" :flow="flow"/>
          <ResourceFlowItem v-for="(flow,index) in researchActivity.flows" :key="index" :flow="flow"/>
          <ResourceFlowItem v-for="(flow,index) in researchActivity.flows" :key="index" :flow="flow"/>
          <ResourceFlowItem v-for="(flow,index) in researchActivity.flows" :key="index" :flow="flow"/>
        </UIFlex>
      </UISection>
    </template>
    <template v-slot:footer>
      <UIFlex direction="row" justifyContent="space-between">
        <UIButton @onClick="startResearch"><UIIcon :src="acceptIcon" size="medium" /><span>Comenzar</span></UIButton>
        <UIButton @onClick="closeResearchConfirmDialog"><UIIcon :src="closeIcon" size="medium" /><span>Cancelar</span></UIButton>
      </UIFlex>
    </template>
  </UIModal>
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
import { Activity, ActivityType, Technology } from "shared/monolyth";
import UIModal from '../components/ui/UIModal.vue';
import UIButton from '../components/ui/UIButton.vue';
import UIIcon from '../components/ui/UIIcon.vue';
import UIFlex from '../components/ui/UIFlex.vue';
import UISection from '../components/ui/UISection.vue';
import ResourceFlowItem from '../components/game/ResourceFlowItem.vue';
import {acceptIcon,closeIcon} from '../components/ui/icons'
import { GameEvents, useGameAPI } from "../services/gameApi";
import { InfopanelTarget, IPActionCallback, TechIPTarget } from "../classes/info";
import { showInfoPanel2 } from '../controllers/ui';
import { ResearchActivityTarget } from "../classes/activities";
import { useRoute, useRouter } from "vue-router";

export default defineComponent({
  components: { UIModal,UIFlex,UISection,ResourceFlowItem,UIButton,UIIcon },
  setup() {
    const router = useRouter();
    const route = useRoute();

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
    
    const infoPanelHandler:IPActionCallback = (cmd:string, data:any) => {
      if(cmd == TechIPTarget.ACTION_RESEARCH){
        openResearchConfirmDialog();
      }else if(cmd == TechIPTarget.ACTION_NAVIGATE){
        treeController?.setSelected(data as Technology);
      }
    }

    const onTechSelected: (tech: Technology) => void = (tech) => {
      techSelected.value = tech;
      showInfoPanel2(new TechIPTarget(tech,infoPanelHandler));
    };

    const startResearch = ()=>{
      closeResearchConfirmDialog();
      api.startActivity(ActivityType.Research,new ResearchActivityTarget(techSelected.value!));
      showInfoPanel2(new TechIPTarget(techSelected.value!,infoPanelHandler));
    }
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
      startResearch,
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