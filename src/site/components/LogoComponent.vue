<template>
    <div class="brand-logo">
        <img :src="logo" />
        <a href="/" class="brand">toomany<span>hex.es</span></a>
    </div>  
</template>

<script>
import logo from "@/assets/site/logo.svg";

export default {
    data(){
        return {logo};
    }
}
</script>

<style lang="scss" scoped>

.brand-logo {
    display:flex;
    flex-flow: row nowrap;
    gap:10px;
    font-size: 1.9em;
    flex-grow: 1;
    height:100%;
    padding:5px;
    align-items: center;
    justify-content: center;
    font-family: Chakra Petch;
    a:link,
    a:visited {
        text-decoration: none;
        color: white;
        font-weight: bold;
    }
    span {
        color: $site-primary-color;
    }
    img{
        @include invisible;
    }
}
@media(min-width:1024px){
    .brand-logo{
        justify-content: flex-start;
        img{
            @include visible(inline-block);
            height:100%;
            max-width:150px;
        }
    }
}
</style>