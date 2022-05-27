<template>
    <div class="error-view" :style="{ backgroundImage: bgImage }">
        <div class="responsive-container" >
            <div class="left">
                <h1>(x_x)</h1>
            </div>
            <div class="right">
                <h2>Ha habido un error</h2>
                <p>{{message}}</p>
            </div>
        </div>
    </div>
</template>

<script>
import { useStore } from '@/store';
import { onMounted } from '@vue/runtime-core';
const store = useStore();

export default {
    data(){
        return{
            bgImage:'url('+require("@/assets/site/white-noise.png")+')'
        }
    },
    computed:{
        message(){
            return store.state.error || "No hay descripción del error.";
        }
    },
    mounted(){
        console.log("wiii",this.bgImage);
    }
}
</script>

<style lang="scss" scoped>
    .error-view{
        height:100%;
        background-position: center center;
        background-size: cover;
    }
    h1{
        font-size:8em;
        text-align:center;
        margin:50px 0 50px 0;
        color:$site-primary-color;
    }
    h2{
        font-size:4em;
        margin:0px;
    }
    .right{
        flex-grow:1;
        display:flex;
        flex-flow: column nowrap;
        justify-content: flex-start;
        gap:50px;
    }
    .responsive-container{
        height: 100%;
        display:flex;
        flex-flow: column nowrap;
        justify-content: space-around;
        color:white;
        padding:15px;
        background-color:rgba(0,0,0,0.4);
    }
    p{
        font-size:1.4em;
    }
</style>