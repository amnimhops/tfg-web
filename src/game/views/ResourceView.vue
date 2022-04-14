<template>
    <UIPane class="resource-view" :style="{ backgroundImage: 'url('+bgImage+')' }">
        <UIFlex gap="10" padding="10">
            <input type="search" name="q" class="mt-10 mb-10"/>

            <UIFlex class="resource-item" v-for="(stat,idx) in resourceStats" :key="idx" alignItems="stretch" gap="5" padding="5">
                <UIFlex direction="row" alignItems="center" gap="5" padding="5">
                    <UIIcon :src="stat.resource.media.icon.url" size="custom-icon-size" />
                    <UILabel :link="true" @onClick="navigate(stat.resource.id)">{{stat.resource.media.name}}</UILabel>
                </UIFlex>
                <UIFlex class="big-numbers" direction="row" justifyContent="space-between">
                    <UILabel class="large">{{stat.available}}</UILabel>
                    <UILabel class="large">{{stat.totalIncome}}</UILabel>
                    <UILabel class="large">{{stat.totalExpense}}</UILabel>
                </UIFlex>
            </UIFlex>
        </UIFlex>
    </UIPane>
</template>

<script lang="ts">
import { Resource } from 'shared/monolyth';
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router';
import { AssetManager, ConstantAssets } from '../classes/assetManager';
import { IPActionCallback, ResourceIPTarget } from '../classes/info';
import * as UI from '../components/ui/';
import { showInfoPanel2 } from '../controllers/ui';
import { GameEvents, ResourceStat, useGameAPI } from '../services/gameApi';

export default defineComponent({
    components:{...UI},
    setup() {
        const api = useGameAPI();
        const router = useRouter();
        const route = useRoute();
        const bgImage = AssetManager.get(ConstantAssets.RESOURCE_BACKGROUND).url;
        const gameData = api.getGameData();

        const apiChanged = ref<number>(Date.now());

        const navigate = (resid:string) => {
            router.replace({name:'resource',params:{id:resid}});
        }

        const panelActionHandler:IPActionCallback = (cmd:string,data:any)=>{
            console.log('Received action handler on resource view')
        }

        const handleApiChanges = () => {
            apiChanged.value = Date.now();
        }

        api.on(GameEvents.Timer, handleApiChanges);

        const resourceStats = computed<ResourceStat[]|undefined>(()=>{
            apiChanged.value;
            const stats = api.calculateResourceStats();
            console.log(stats);
            return stats;
        });

        const resourceIdentifierWatcherStopper = watch(()=>route.params.id, (newId)=>{
            showInfoPanel2(new ResourceIPTarget(gameData.resources[newId as string],panelActionHandler));
        })

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
                resourceIdentifierWatcherStopper();
            }
        });

        onMounted( () => {
            console.log('Resource view mounted')
            if(route.params.id){
                const id = route.params.id as string;
                console.log('Route id is',id)
                showInfoPanel2(new ResourceIPTarget(gameData.resources[id],panelActionHandler));
            }
        });

        onUnmounted(()=>{
            api.off(GameEvents.Timer,handleApiChanges);
        })
        return {resourceStats,bgImage,navigate};
    },
})
</script>

<style lang="scss" scoped>
    .resource-view{
        height:100vh;
        padding-top:105px;
        overflow-y: auto;
        background-size: cover;
    }
    
    img.responsive{
        height:200px;
    }
    .custom-icon-size{
        width:32px;
        height:32px;
    }
    .resource-item{

    }
    .big-numbers{
        
    }
    input[type=search]{
        height:50px;
    }

</style>