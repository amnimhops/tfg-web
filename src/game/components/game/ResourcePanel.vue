<template>
  <div>
    <UIPane v-if="stockpiles">
      <UIFlex class="resource-panel-container" direction="row">
        <UIFlex class="resource-panel" :class="{ collapsed }" direction="row" align-items="center" justify-content="flex-start" gap="10" :wrap="true">
          <UIFlex v-for="(stockpile, index) in stockpiles" :key="index" direction="row" gap="10" align-items="center">
            <UIFlex direction="row" class="mar-5" alignItems="center">
              <UIIcon
                class="mr-5"
                :src="resources[stockpile.resourceId].media.icon.url"
                size="icon-custom-size"
                :alt="resources[stockpile.resourceId].media.name"
              />
              <UILabel
                @onClick="onResourceClicked(stockpile.resourceId)"
                title="Ver este recurso"
                link
                >{{ fmtResourceAmount(stockpile.amount) }}</UILabel
              >
            </UIFlex>
          </UIFlex>
        </UIFlex>
        <UIButton
          class="resource-button"
          :rounded="false"
          justify="center"
          borderless
          @onClick="toggleResourcePanel"
        >
          <UIIcon :src="ellipsisIcon" size="medium" />
        </UIButton>
      </UIFlex>
    </UIPane>
  </div>
</template>

<script lang="ts">
import UIPane from '../ui/UIPane.vue'
import UIIcon from '../ui/UIIcon.vue';
import UIFlex from '../ui/UIFlex.vue';
import UIButton from '../ui/UIButton.vue';
import UILabel from '../ui/UILabel.vue';
import  {ellipsisIcon} from '@/game/components/ui/icons'
import { useStore } from '@/store';
import { GameEvents, useGameAPI } from '@/game/services/gameApi';
import { Stockpile } from '@/shared/monolyth';
import { computed, defineComponent, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {fmtResourceAmount} from '../../classes/formatters'
const store = useStore();


export default defineComponent({
  components:{UIPane,UIIcon,UIFlex,UILabel,UIButton},
  setup() {
    const collapsed = ref<boolean>(true);
    const router = useRouter();
    const api = useGameAPI();

    const toggleResourcePanel = () => {
        collapsed.value = ! collapsed.value;
    }
    const apiChanged = ref<number>(Date.now());
    const apiTimerHandler = () => {
      
      apiChanged.value = Date.now();
    };
    
    api.on(GameEvents.Timer,apiTimerHandler);
    const stockpiles = computed<Stockpile[]|undefined>( () => {
        apiChanged.value;        
        return  api.getCurrentPlayer().stockpiles;
    });

    const resources = api.getGameData().resources;

    const onResourceClicked = (id:string) => {
      router.push({name:'resource',params:{id}});
    }
    onUnmounted(()=> {
      api.off(GameEvents.Timer,apiTimerHandler);
    })

    return {ellipsisIcon,collapsed,stockpiles,resources,toggleResourcePanel,onResourceClicked,fmtResourceAmount};
  }
});
</script>

<style lang="scss" scoped>
.icon-custom-size {
  height: 38px;
  width: 38px;
}
.ui-label{
  min-width: 75px;
}
.resource-panel {
  background-color: $ui-control-background-color;
  &.collapsed {
    height: 48px; // 38px de icon-custom-size + 10 de margen
    overflow: hidden;
  }
}
.resource-button {
  padding: 0px;
  min-width: 48px; // Igual que el alto de resource-panel
  background-color: transparent;
}
</style>