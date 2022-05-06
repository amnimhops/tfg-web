<template>
    <UIPane id="menu" class="menu-pane">
        <UIFlex direction="column" justifyContent="space-around">
            <UIFlex direction="row" alignItems="center" gap="15" class="nav-mobile">
                <UIButton @onClick="toggleMenu" borderless :rounded="false">
                    <UIIcon :src="menuIcon" size="menu-icon-size"/>
                </UIButton>
                <UILabel class="extra-large nav-title" v-if="currentSection">{{currentSection.label}}</UILabel>
                <UIButton @onClick="toggleFullscreen" borderless>
                    <UIIcon :src="fullscreenIcon" size="menu-icon-size"/>
                </UIButton>
            </UIFlex>
            <UIFlex class="menu-items" :class="{active:menuActive}">
                <UIButton v-for="link in sections" :key="link.id" borderless :rounded="false" padding="15" grow :class="{selected:(link.id==(currentSection?.id||'area'))}" @onClick="changeSection(link.id)">
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
import {menuIcon, fullscreenIcon} from '@/game/components/ui/icons';
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
    setup(props) {
        console.log(props)
        const router = useRouter();
        const route = useRoute();
        const sections = ref<NavLink[]>([
            {icon:AssetManager.get(ConstantAssets.ICON_SECTION_AREA).url,label:'Mi zona',id:'area'},
            {icon:AssetManager.get(ConstantAssets.ICON_SECTION_RESOURCES).url,label:'Recursos',id:'resource'},
            {icon:AssetManager.get(ConstantAssets.ICON_SECTION_TECHNOLOGY).url,label:'Tecnología',id:'technology'},
            {icon:AssetManager.get(ConstantAssets.ICON_SECTION_WORLD).url,label:'Mapa',id:'world'},
            {icon:AssetManager.get(ConstantAssets.ICON_SECTION_ACTIVITIES).url,label:'Actividades',id:'activity'},
            {icon:AssetManager.get(ConstantAssets.ICON_SECTION_MESSAGES).url,label:'Mensajes',id:'messaging'}
        ]);
        const currentSection = ref<NavLink|undefined>(sections.value.find( section=>section.id == route.name));
        const menuActive = ref<boolean>(false);
        const toggleMenu = ()=>{
            menuActive.value = !menuActive.value;console.log(menuActive.value)
        }
        const toggleFullscreen = ()=>{
            document.body.requestFullscreen();
        }
        router.afterEach((to)=>{
            currentSection.value = sections.value.find( section=>section.id == to.name);
            console.log(currentSection.value);
        })
        const changeSection = (section:string)=>{
            // NOTA: Ojo con quitar esto, o los paneles internos no se desmontan,
            // conservando las referencias a la API
            showInfoPanel2(null);
            toggleMenu();
            router.push({path:`/game/${section}`});
        }
        return {sections,menuIcon,fullscreenIcon,toggleMenu,toggleFullscreen,menuActive,changeSection,currentSection};
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
.icon-custom-size.ui-icon,.menu-icon-size{
    width:40px;
    height:40px;
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