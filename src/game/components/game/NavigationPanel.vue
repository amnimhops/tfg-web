<template>
    <UIPane>
        <UIFlex direction="row" justifyContent="space-around" gap="50">
            <UIButton v-for="(link,index) in sections" :key="index" justify="space-around" @onClick="performActivity(activity)" :grow="true" borderless>
                <UIIcon :src="link.icon" size="large"/>
                <UILabel>{{link.label}}</UILabel>
            </UIButton>
        </UIFlex>
    </UIPane>
</template>

<script lang="ts">
import { AssetManager, ConstantAssets } from '@/game/classes/assetManager'
import UIFlex from '@/game/components/ui/UIFlex.vue';
import UIIcon from '@/game/components/ui/UIIcon.vue';
import UILabel from '@/game/components/ui/UILabel.vue';
import UIButton from '@/game/components/ui/UIButton.vue';
import UIPane from '@/game/components/ui/UIPane.vue';
import { Asset } from 'shared/monolyth'
import { defineComponent, ref } from 'vue'
interface NavLink{
    icon:string;
    label:string;
    href:string
}
export default defineComponent({
    components:{UIFlex,UIIcon,UILabel,UIPane,UIButton},
    setup() {
        const sections = ref<NavLink[]>([
            {icon:AssetManager.get(ConstantAssets.ICON_BUILD).url,label:'Mi lo que sea',href:'bar'},
            {icon:AssetManager.get(ConstantAssets.ICON_BUILD).url,label:'Recursos',href:'bar'},
            {icon:AssetManager.get(ConstantAssets.ICON_BUILD).url,label:'Tecnología',href:'bar'},
            {icon:AssetManager.get(ConstantAssets.ICON_BUILD).url,label:'Mapa/mundo',href:'bar'},
            {icon:AssetManager.get(ConstantAssets.ICON_BUILD).url,label:'Actividades',href:'bar'},
            {icon:AssetManager.get(ConstantAssets.ICON_BUILD).url,label:'Mensajes',href:'bar'}
        ]);

        return {sections};
    },
})
</script>

<style lang="scss" scoped>
.ui-pane{
    position:fixed;
    z-index:1;
    height:75px;
    width:100%;
    background-color:$ui-control-foreground-color;
    &>.ui-flex{
        height:100%;
    }
}
</style>