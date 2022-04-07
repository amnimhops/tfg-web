<template>
  <div class="footer">
      <ul class="responsive-container">
          <li>&copy; 2022, vendor.com</li>
          <li v-for="(link,index) in links" :key="index">
              <a :href="link.href">{{link.title}}</a>
          </li>
      </ul>
  </div>
</template>

<script>
export default {
    data(){
        return{
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
        padding:10px;
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
    li{
        
    }

    @media(min-width:768px){
        ul{
            flex-flow: row nowrap;
            justify-content: space-evenly;
        }
    }
</style>