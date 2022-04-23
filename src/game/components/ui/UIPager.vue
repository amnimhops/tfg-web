<template>
    <UIFlex class="ui-pager" direction="row" alignItems="stretch">
        <UIButton class="left" @onClick="prev" title="Página anterior"><UIIcon :src="leftIcon" size="medium" /></UIButton>
        <UIFlex class="pages" direction="row">
            <UIButton @onClick="select(n)" class="page"  v-for="n in pages" :key="n" :class="{selected:(n==currentPage)}" :title="`Página ${n} `" justify="center">
                <UILabel>{{n}}</UILabel>
            </UIButton>
        </UIFlex>
        <UILabel class="page-counter">Página {{page}}/{{pages}}</UILabel>
        <UIButton class="right" @onClick="next" title="Página siguiente"><UIIcon :src="rightIcon" size="medium" /></UIButton>
    </UIFlex>
</template>
<script lang="ts">
import { defineComponent, onMounted, onUpdated, ref, watch } from 'vue'
import UIFlex from './UIFlex.vue';
import UIButton from './UIButton.vue';
import UIIcon from './UIIcon.vue';
import UILabel from './UILabel.vue';
import {leftIcon,rightIcon} from './icons';

export default defineComponent({
    components:{UIFlex,UIButton,UIIcon,UILabel},
    props:["page","pages"],
    emits:['onChange'],
    setup(props,{emit}) {
        const currentPage = ref<number>(props.page);
        //const pageCount = ref<number>(props.pages)
        const prev = () => select(Math.max(1,currentPage.value-1));
        const next = () => select(Math.min(props.pages,currentPage.value+1));
        const select = (i:number) => {
            currentPage.value = i;
            emit('onChange',currentPage.value);
            console.log(currentPage.value)
        }

        return {prev,next,select,currentPage,leftIcon,rightIcon}
    },
})
</script>


<style lang="scss" scoped>
    .ui-pager{
        gap:15px;
        justify-content: space-between;
        align-items: stretch;
    }
    .pages{
        gap:5px;
        justify-content: center;
    }
    .page{
        @include invisible
    }
    .page-counter{
        align-self: center;
    }
    .page.selected{
        background-color:$ui-control-background-secondary;
        font-weight:bold;
    }

    @media(min-width:768px){
        .page{
            @include visible(flex);
            min-width: 48px;
        }
        .page-counter{
            @include invisible;
        }
    }
</style>