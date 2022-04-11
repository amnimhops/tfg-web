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
                @onClick="onResourceClicked(stockpile.resource.id)"
                title="Ver este recurso"
                link
                >{{ stockpile.amount }}</UILabel
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
import { useGameAPI } from '@/game/services/gameApi';
import { Resource, Stockpile } from 'shared/monolyth';
import { computed, defineComponent, ref } from 'vue';

const store = useStore();


export default defineComponent({
  components:{UIPane,UIIcon,UIFlex,UILabel,UIButton},
  setup() {
    const collapsed = ref<boolean>(true);
    const store = useStore();
    const toggleResourcePanel = () => {
        collapsed.value = ! collapsed.value;
    }

    const stockpiles = computed<Stockpile[]|undefined>(  () => {
        return store.state.stockpiles;
        
    });
    const resources = computed<Record<string,Resource>>( () => {
        return useGameAPI().getGameData().resources;
    });

    return {ellipsisIcon,collapsed,stockpiles,resources,toggleResourcePanel};
  }
});
</script>

<style lang="scss" scoped>
.icon-custom-size {
  height: 38px;
  width: 38px;
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