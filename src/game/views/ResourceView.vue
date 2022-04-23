<template>
    <UIPane class="resource-view" :style="{ backgroundImage: 'url('+bgImage+')' }">
        <UIFlex class="resource-list" gap="20" padding="10" justifyContent="space-around">
            <input id="resource-search" type="search" name="q" class="mt-10 mb-10" @change="filterResources" v-model="query"/>

            <UIFlex class="resource-item" v-for="(stat,idx) in resourceStats" :key="idx" alignItems="stretch" gap="5">
                <ResourceSummary :stat="stat" iconSize="resource-summary-icon-size"/>
            </UIFlex>
        </UIFlex>
    </UIPane>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router';
import { AssetManager, ConstantAssets } from '../classes/assetManager';
import { IPActionCallback, ResourceIPTarget } from '../classes/info';
import * as UI from '../components/ui/';
import ResourceSummary from '../components/game/ResourceSummary.vue';
import { showInfoPanel2 } from '../controllers/ui';
import { GameEvents, ResourceStat, useGameAPI } from '../services/gameApi';
import { fmtResourceAmount } from '../classes/formatters';
export default defineComponent({
    components:{...UI,ResourceSummary},
    setup() {
        const api = useGameAPI();
        const router = useRouter();
        const route = useRoute();
        const bgImage = AssetManager.get(ConstantAssets.RESOURCE_BACKGROUND).url;
        const gameData = api.getGameData();

        const query = ref<string>();
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
            /**
             * Generalmente usaríamos un watch() para detectar los
             * cambios en query.value debidos al input, pero como 
             * este método se actualiza 1/s cuando la api informa,
             * basta con leer el nuevo valor de query.value
             */
            const textQuery = (query.value||'').toLowerCase();
            return stats.filter(stat => stat.resource.media.name.toLowerCase().indexOf(textQuery)>=0);
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
        return {resourceStats,bgImage,navigate,fmtResourceAmount,query};
    },
})
</script>

<style lang="scss">
    #resource-search{
        width:100%;
    }
    .resource-view{
        height:100vh;
        padding-top:105px;
        overflow-y: auto;
        background-size: cover;
    }

    .resource-summary-icon-size{
        width:32px;
        height:32px;
    }
@media(min-width:768px){
    // El motivo de hacer sel.sel es para
    // darle más especificidad que la que tiene
    // por defecto y reescribir el valor de justify-content
    .ui-flex.resource-list{ 
        flex-flow: row wrap;
        justify-content: space-around;
        gap:50px;
        
    }
    .resource-item{
        width:320px;
    }
    .resource-summary-icon-size{
        width:64px;
        height:64px;
    }
    hr{
        @include invisible;
    }
    
}
</style>