<template>
    <UIPane id="menu" class="menu-pane">
        <UIFlex direction="column" justifyContent="space-around">
            <UIFlex direction="row" alignItems="center" gap="15" class="nav-mobile">
                <UIButton @onClick="toggleMenu" borderless :rounded="false">
                    <UIIcon class="fu" :src="menuIcon" size="medium"/>
                </UIButton>
                <UILabel class="extra-large nav-title">Mi area</UILabel>
            </UIFlex>
            <UIFlex class="menu-items" :class="{active:menuActive}">
                <UIButton v-for="link in sections" :key="link.id" borderless :rounded="false" padding="15" grow :class="{selected:(link.id==tab)}" @onClick="changeTab(link.id)">
                    <UIIcon :src="link.icon" size="icon-custom-size"/>
                    <UILabel class="large">{{link.label}}</UILabel>
                </UIButton>
            </UIFlex>
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
import {menuIcon} from '@/game/components/ui/icons';
import { Asset } from 'shared/monolyth'
import { defineComponent, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router';
import { showInfoPanel2 } from '@/game/controllers/ui';
interface NavLink{
    icon:string;
    label:string;
    id:string
}
export default defineComponent({
    components:{UIFlex,UIIcon,UILabel,UIPane,UIButton},
    props:["tab"],
    setup(props) {
        console.log(props)
        const router = useRouter();
        const sections = ref<NavLink[]>([
            {icon:AssetManager.get(ConstantAssets.ICON_BUILD).url,label:'Mi zona',id:'home'},
            {icon:AssetManager.get(ConstantAssets.ICON_BUILD).url,label:'Recursos',id:'resource'},
            {icon:AssetManager.get(ConstantAssets.ICON_BUILD).url,label:'Tecnología',id:'technology'},
            {icon:AssetManager.get(ConstantAssets.ICON_BUILD).url,label:'Mapa',id:'world'},
            {icon:AssetManager.get(ConstantAssets.ICON_BUILD).url,label:'Actividades',id:'activity'},
            {icon:AssetManager.get(ConstantAssets.ICON_BUILD).url,label:'Mensajes',id:'messaging'}
        ]);
        const menuActive = ref<boolean>(false);
        const toggleMenu = ()=>{
            menuActive.value = !menuActive.value;console.log(menuActive.value)
        }
        const changeTab = (tab:string)=>{
            // NOTA: Ojo con quitar esto, o los paneles internos no se desmontan,
            // conservando las referencias a la API
            showInfoPanel2(null);
            router.push({path:`/game/${tab}`});
        }
        return {sections,menuIcon,toggleMenu,menuActive,changeTab};
    },
})
</script>

<style lang="scss" scoped>
.menu-pane{
    background-color:$ui-control-foreground-color;
    &>.ui-flex{
        height:100%;
    }
}
.menu-items{
    @include invisible;
    &.active{
        @include visible(flex);
    }
}
.nav-title{
    flex-grow: 1;
    text-align:center;
}
// Sobreescribimos el tamaño por defecto de los iconos para "responsivizar"
.icon-custom-size.ui-icon{
    width:16px;
    height:16px;
}
.selected{
    background-color:$ui-control-background-secondary;
}
@media(min-width:768px){
    .nav-mobile{
        @include invisible;
    }
    .menu-items{
        @include visible(flex);
        flex-direction: row;
    }
    .icon-custom-size.ui-icon{
        width:40px;
        height:40px;
    }
    .menu-items .ui-label{
        @include invisible
    }
}
@media(min-width:1440px){
    .menu-items .ui-label{
        @include visible(block);
        font-weight: bold;
    }
}
</style>