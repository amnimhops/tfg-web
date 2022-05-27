<template>
  <div class="footer">
      <ul class="responsive-container">
          <li class="legal">
              <a href="https://creativecommons.org/licenses/by-nc-sa/3.0/es/"><img class="cc" :src="cc" /></a>
              <router-link to="/license">Algunos derechos reservados</router-link>
            </li>
          <li v-for="(link,index) in links" :key="index">
              <a :href="link.href">{{link.title}}</a>
          </li>
      </ul>
  </div>
</template>

<script>
const cc =  require("@/assets/site/by-nc-sa.png");
export default {
    data(){
        return{
            cc,
            links:[
                {href:'/tos',title:'Términos y condiciones'},
                {href:'/privacity',title:'Privacidad'}
            ]
        }
    }
}
</script>

<style lang="scss" scoped>
    .footer{
        background-color:black;
        color:white;
        a:link,a:visited{
            font-size:1em;
            color:white;
        }
    }
    ul{
        list-style: none;
        display:flex;
        flex-flow: column nowrap;
        align-items: center;
        padding:0;
        gap:10px;
    }
    .legal{
        display:flex;
        flex-flow:row nowrap;
        gap:5px;
        align-items: center;
    }
    .cc{
        max-height:32px;
    }

    @media(min-width:768px){
        ul{
            flex-flow: row nowrap;
            justify-content: space-evenly;
        }
    }
</style>