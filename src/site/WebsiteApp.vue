<template>
    <MenuComponent v-if="enableMenuses"/>
    <div class="layout website">
        <div class="content">
            <router-view></router-view>
        </div>
        <FooterComponent v-if="enableMenuses"/>
    </div>
</template>

<script>

import MenuComponent from '@/site/components/MenuComponent.vue'
import FooterComponent from '@/site/components/FooterComponent.vue'
import { useStore } from '@/store';
const store = useStore();
export default {
    components:{MenuComponent, FooterComponent},
    computed:{
        enableMenuses(){
            return store.state.enableMenuses;
        }
    }
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
    
    .website{
        input{
            font-family: 'Saira Semi Condensed' !important;
            border-radius:5px;
            height:50px;
            font-size:1.2em;
        }
        button {
            font-family: 'Saira Semi Condensed' !important;
            border-radius:5px;
            //height:40px;
            font-size:1.0em;
        }
        
        .button{
            border-radius:8px;
            padding:10px;
            
            box-shadow: 5px 5px 5px black;
            font-size:1.5em;
            color:black;
            text-decoration: none;
            

            &.disabled{
                pointer-events:none;
                opacity:0.5;
            }

            &.primary{
                background-color:$site-primary-color;
                &:hover{
                    background-color:$site-primary-color-hover;
                }
            }
            &.secondary{
                background-color:$site-secondary-color;
                &:hover{
                    background-color:$site-secondary-color-hover;
                }
            }
        }

        .site-error{
            color:$site-danger-light;
            opacity:0.9;
            margin:0px;
            text-align: right;
        }
        .site-info{
            color:$site-secondary-color;
            opacity:0.9;
            margin:0px;
            text-align: center;
        }

        @media(min-width:1024px){
            .responsive-container{
                max-width: 1024px;
                margin-left:auto;
                margin-right:auto;
            }
        }
    }

</style>