<template>
    <MenuComponent />
    <div class="layout">
        <div class="content">
            <router-view></router-view>
        </div>
        <FooterComponent />
    </div>
</template>

<script>
import HomeView from '@/site/views/HomeView.vue'
import MenuComponent from '@/site/components/MenuComponent.vue'
import FooterComponent from '@/site/components/FooterComponent.vue'

export default {
    components:{MenuComponent, FooterComponent}
};

</script>
<style lang="scss">
    
    body{
        margin:0px;
        padding:0px;
        background-color: black;
    }
    *{
        box-sizing: border-box;
        
    }
    .layout{
        display:flex;
        height:100vh;
        flex-flow: column nowrap;
        justify-content: space-between;
    }
    .content{
        flex-grow: 1;
    }
</style>