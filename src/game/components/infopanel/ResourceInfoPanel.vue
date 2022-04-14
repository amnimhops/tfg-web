<template>
    
</template>

<script lang="ts">
import { CellIPTarget, ExistingPlaceableIPTarget, ResourceIPTarget } from '@/game/classes/info'
import { GameEvents, useGameAPI } from '@/game/services/gameApi'
import { ActivityType, Media, Placeable } from 'shared/monolyth'
import { computed, defineComponent, onUnmounted, PropType, ref } from 'vue'
import { showInfoPanel2 } from '@/game/controllers/ui'
import { AssetManager, ConstantAssets } from '@/game/classes/assetManager'
import { BuildingActivityTarget } from '@/game/classes/activities'
import * as UI from '../ui';
interface BuildingInQueue{
    remaining?:string;
    media:Media;
}

export default defineComponent({
    components:{...UI},
    props:{
        target:Object as PropType<ResourceIPTarget>
    },
    setup(props) {
        const api = useGameAPI();

        /*const apiChanged = ref<number>(Date.now());
        const gameData = api.getGameData();

        const handleApiChanges = ()=>{
            console.log('api change detected')
            apiChanged.value = Date.now();
        }

        api.on(GameEvents.Timer, handleApiChanges);
*/


        return {}
    },
})
</script>

<style>

</style>