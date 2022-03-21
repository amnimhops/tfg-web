<template >
  <div class="player-map">
    <canvas ref="canvas" id="player-map"></canvas>
    <div class="fullscreen"></div>
  </div>
  <BuildingPicker v-if="picker" @onClose="closePicker" :structures="selection.getCell().getPlaceables()" @onSelect="buildStructure"/>
</template>

<script>
import {PlayerMapController,PlayerMapEvents} from '@/game/controllers/playerMapController';
import BuildingPicker from '@/components/game/BuildingPicker.vue';
import {store} from '@/store'
import {startActivity}  from '@/game/services/gameApi';
import {BuildActivity} from '@/game/models/activities';
import { CellInstanceTarget } from '@/game/models/cells';

export default {
  components:{BuildingPicker},
  data(){
    return {
      picker:false,
      selectedBuilding:null,
      selection:null
    }
  },
  mounted() {
    const canvas = document.getElementById("player-map");
    const cells = store.state.cells;
    const pmc = new PlayerMapController(canvas,cells);
    pmc.on(PlayerMapEvents.CELL_SELECTED,this.onCellSelected)
    window.addEventListener("resize", this.resizeCanvas);
    this.resizeCanvas()
  },
  methods: {
    resizeCanvas() {
      const [w, h] = [document.documentElement.clientWidth,document.documentElement.clientHeight];
      console.log(w, h,window.innerWidth,window.innerHeight);
      if(this.$refs.canvas != null){
        const canvas = this.$refs.canvas;
        canvas.width = Math.floor(canvas.parentNode.clientWidth);
        canvas.height = Math.floor(canvas.parentNode.clientHeight);
      }
    },
    closePicker(){
      this.picker=false;
    },
    openPicker(){
      this.picker = true;
    },
    onCellSelected(cellInstance){
      this.selection = cellInstance;
      store.commit('panelSelection', new CellInstanceTarget(cellInstance,this.chooseStructure));
    },
    chooseStructure(data){
      console.log("Construyendo!",data)
      this.$store.commit('panelSelection',null); // Cierra el panel
      this.openPicker();
    },
    buildStructure(structure){      
      const activity = new BuildActivity(structure);
      this.closePicker();
      startActivity(activity);
    }
  }
};
</script>

<style lang="scss" scoped>
  .player-map{
    position:fixed;
    top:0;
    width:100%;
    height:100%;
  }
  canvas{
    background-color:red;
  }
</style>