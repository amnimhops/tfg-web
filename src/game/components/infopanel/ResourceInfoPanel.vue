<template>
    
</template>

<script lang="ts">
import { ResourceIPTarget } from '@/game/classes/info'
import { useGameAPI } from '@/game/services/gameApi'
import { Media } from 'server/monolyth'
import { defineComponent, PropType } from 'vue'
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

        return {}
    },
})
</script>

<style>

</style>