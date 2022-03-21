<template>
    <div>
        <UIPane v-if="stockpiles">
            <UIFlex direction="row" align-items="center" justify-content="space-between" padding="5">
            
            <UIFlex v-for="(stockpile,index) in stockpiles" :key="index" direction="row" gap="5" align-items="center">
                <UIIcon :src="stockpile.resource.icon.url" size="medium" :alt="stockpile.resource.name"/>
                <UILabel @onClick="onResourceClicked(stockpile.resource.id)" title="Ver este recurso" link>{{stockpile.amount}}</UILabel>
            </UIFlex>    
            </UIFlex>
            
        </UIPane>
        
    </div>
</template>

<script>
import UIPane from '../ui/UIPane.vue'
import UIIcon from '../ui/UIIcon.vue';
import UIFlex from '../ui/UIFlex.vue';
import UILabel from '../ui/UILabel.vue';
import {InfoPanelTarget} from '@/components/infopanel/InfoPanel.vue'
import { useStore } from '@/store';
import { key } from '@/store';

const store = useStore(key);

export default {
    components:{UIPane,UIIcon,UIFlex,UILabel},
    methods:{
        onResourceClicked(id){
            const res = store.state.world.resources[id];
            console.log(res,id);
            store.commit('panelSelection',new InfoPanelTarget({
                title:res.name,
                description:res.description,
                image:res.image.url
            }));
        }
    },
    computed:{
        stockpiles(){
            const sp = store.state.stockpiles;
            //console.log("stosk",sp);
            return sp;
        }
    },
    mounted(){
        setInterval(()=>{
            const id = store.state.stockpiles[0].getResource().getId();
            store.commit('addResource',{id,amount:25});
        },1000)
    }
}
</script>

<style lang="scss" scoped>

.ui-pane{
  position:fixed;
  z-index:1;
  height:38px;
  width:100%;
  &>.ui-flex{
      height:100%;
  }
}
</style>