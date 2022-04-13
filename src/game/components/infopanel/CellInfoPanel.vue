<template>
    <!--Structure dropdown-->
    <!--
    <UIFlex v-if="dropdownData.length > 0" padding="10">
    <UIDropdown :data="dropdownData" @change="select" :index="selectedIndex" v-if="dropdownData.length > 1">
        <template v-slot="item">
        <UIFlex direction="row" align-items="center" gap="15" padding="10">
            <img :src="item.image" style="width:50px;height:50px;" />
            <UILabel>{{item.title}}</UILabel>
        </UIFlex>
        </template>
    </UIDropdown>
    </UIFlex>
    -->
    <UISection title="Construcciones" class="ml-10">
        <UIFlex padding="10">
            <UIButton v-for="(placeable,index) in placeables" :key="index" :borderless="true" :rounded="false" grow @click="openBuilding(placeable)">
                <UIIcon :src="placeable.media.thumbnail.url" size="large" />
                <UILabel>{{placeable.media.name}}</UILabel>
            </UIButton>
        </UIFlex>
    </UISection>
    <UISection title="Actividades" class="ml-10">
        <UIFlex padding="10">
            <UIButton v-for="(placeable,index) in placeables" :key="index" :borderless="true" :rounded="false" grow>
                <UIIcon :src="placeable.media.thumbnail.url" size="large" />
                <UILabel>{{placeable.media.name}}</UILabel>
            </UIButton>
        </UIFlex>
    </UISection>
</template>

<script lang="ts">
import { CellIPTarget, ExistingPlaceableIPTarget } from '@/game/classes/info'
import { useGameAPI } from '@/game/services/gameApi'
import { Placeable } from 'shared/monolyth'
import { computed, defineComponent, PropType } from 'vue'
import UIFlex from '../ui/UIFlex.vue'
import UIButton from '../ui/UIButton.vue'
import UISection from '../ui/UISection.vue'
import UILabel from '../ui/UILabel.vue'
import UIIcon from '../ui/UIIcon.vue'
import { showInfoPanel, showInfoPanel2 } from '@/game/controllers/ui'
export default defineComponent({
    components:{UIIcon,UIButton,UIFlex,UISection, UILabel},
    props:{
        target:Object as PropType<CellIPTarget>
    },
    setup(props) {
        const api = useGameAPI();
        const placeables = computed<Placeable[]>( ()=> {
            return props.target?.cellInstance.placeableIds.map( id => api.getGameData().placeables[id]) || [];
        });

        const openPlaceable = (placeable:Placeable) => {
            showInfoPanel2(new ExistingPlaceableIPTarget(props.target,placeable.id));
        }
 
        return {placeables}
    },
})
</script>

<style>

</style>