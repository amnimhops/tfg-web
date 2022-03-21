<template>
  <ResourcePanel />
  <div id="current-view" class="current-view" ref="playerMap">
    <PlayerMap v-if="resourcesLoaded" />
  </div>
  <InfoPanel />
</template>
<script>
import InfoPanel from "@/components/infopanel/InfoPanel.vue";
import PlayerMap from "@/components/game/PlayerMap.vue";
import ResourcePanel from "@/components//game/ResourcePanel.vue";
import { AssetManager, Assets } from "@/game/models/assets";
import { Loader } from "resource-loader";

import {
  authenticate,
  findGameAssets,
  getWorldDescriptor,
} from "@/game/services/gameApi";
import { useStore } from '@/store';



const store = useStore();
export default {
  components: { InfoPanel, PlayerMap, ResourcePanel },
  mounted() {
    window.showPanel = () => (this.showPanel = !this.showPanel);
    authenticate("gametoken")
      .then((playerInfo) => {
        store.commit('setCells',playerInfo.getCells());
        store.commit('setStockpiles',playerInfo.getStockpiles())

        return getWorldDescriptor();
      })
      .then((world) => {
        console.log("World loaded", world);
        store.commit('setWorld',world);
        return findGameAssets();
      })
      .then((assets) => {
        assets.forEach((asset) => AssetManager.add(asset));

        const loader = new Loader();
        assets.forEach((asset) => loader.add(asset.id, asset.url));

        loader.load((loader, resources) => {
          for (let id in resources) {
            // Vinculamos la definición del asset con su contenido
            AssetManager.get(id).data = resources[id].data;
            console.log("Added", id);
          }
          this.resourcesLoaded = true;

        });
      })
      .catch((error) => {
        console.error(error);
      });
  },
  methods: {},
  data() {
    return {
      resourcesLoaded: false,
      contentSize: {
        x: 0,
        y: 0,
      },
    };
  },
  computed: {
    panelSelection() {
      console.log(store.state.panelSelection);
      return store.state.panelSelection;
      /* return new InfoPanelTarget({
                title:'Un panel de cosas'
            })*/
    },
  },
};
</script>

<style lang="scss">

*{
  box-sizing: border-box;
}
body{
  margin:0px;
  padding:0px;
}
#game-client{
  height:100vh;
  width:100vw;
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