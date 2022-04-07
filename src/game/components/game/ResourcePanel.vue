<template>
    <div>
        <UIPane v-if="stockpiles">
            <UIFlex class="resource-panel" direction="row" align-items="center" justify-content="space-between" padding="10" :wrap="true">
            
            <UIFlex v-for="(stockpile,index) in stockpiles" :key="index" direction="row" gap="5" align-items="center">
                <UIIcon :src="resources[stockpile.resourceId].media.icon.url" size="medium" :alt="resources[stockpile.resourceId].media.name"/>
                <UILabel @onClick="onResourceClicked(stockpile.resource.id)" title="Ver este recurso" link>{{stockpile.amount}}</UILabel>
            </UIFlex>    
            </UIFlex>
            
        </UIPane>
        
    </div>
</template>

<script lang="ts">
import UIPane from '../ui/UIPane.vue'
import UIIcon from '../ui/UIIcon.vue';
import UIFlex from '../ui/UIFlex.vue';
import UILabel from '../ui/UILabel.vue';
import { useStore } from '@/store';
import { useGameAPI } from '@/game/services/gameApi';
import { Resource } from 'shared/monolyth';

const store = useStore();

export default {
    components:{UIPane,UIIcon,UIFlex,UILabel},
    methods:{
       /* onResourceClicked(id){
            const res = store.state.world.resources[id];
            console.log(res,id);
            store.commit('panelSelection',new InfoPanelTarget({
                title:res.name,
                description:res.description,
                image:res.image.url
            }));
        }*/
    },
    computed:{
        stockpiles(){
            const sp = store.state.stockpiles;
            console.log("stosk",sp);
            return sp;
        },
        resources():Record<string,Resource>{
            return useGameAPI().getGameData().resources;
        }
    }
}
</script>

<style lang="scss" scoped>

.ui-pane{
  position:fixed;
  top:75px;
  z-index:1;
  height:auto;
  width:100%;
  background-color:$ui-control-background-color;
  &>.ui-flex{
      height:100%;
  }
}
</style>