<template>
  <div class="login" :style="{ backgroundImage: bgImage }" :class="{lightsOn}">
    <form class="responsive-container" @submit.prevent="login">
      <div class="login-form" v-if="game" :class="loggingStatus">
        <div class="logo"><LogoComponent /></div>
        <div class="form">
          <div class="title">
            <h1>{{game.media.name}}</h1>
            <div class="description">Antes de continuar debes iniciar sesión.</div>
          </div>
          <div class="controls">
            <div class="form-control">
              <label for="name">Correo electrónico</label>
              <input v-model="email" type="text" name="email" placeholder="pepe@perez.com" />
            </div>
            <div class="form-control">
              <label for="name">Contraseña</label>
              <input v-model="password" type="password" name="password" placeholder="clave" />
            </div>
            <div class="form-control site-error" v-if="error">
              <p>{{error}}</p>
            </div>
             <div class="buttons">
              <div class="form-control">
                <button type="submit" class="button primary">Entrar</button>
              </div>
              <div class="registration-tip">
                <router-link to="/register">Crear una cuenta</router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, PropType, ref } from 'vue'
import {Game} from 'server/monolyth';
import { useGameAPI } from '@/game/services/gameApi';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '@/store';
import { randomItem } from 'server/functions';
import LogoComponent from "@/site/components/LogoComponent.vue";
export default defineComponent({
  components:{LogoComponent},
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const api = useGameAPI();

    const lightsOn = ref<boolean>(false);
    const game = ref<Partial<Game>|null>(null);
    const error = ref<string|null>(null);
    const email = ref<string>('');
    const password = ref<string>('');
    const loggingStatus = ref<string>('');

    const bgImage = computed<string|null>( ()=> {
      return game.value != null ? 'url('+game.value.media!.image.url+')' : null
    });

    store.commit("enableMenuses",false);
    
    onMounted( async ()=>{
      console.log('mounted')
      const games = await api.getGameList();
      const id = route.params.id;
      const selected = games.find( g => g.id == id) || null;
      game.value = selected;
      if(game.value){
        console.log('mounted',game.value)
      }else{
        console.log('Login sin juego especificado');
        game.value = randomItem(games);
      }
      
      lightsOn.value = true;
    });

    const login = () => {
      error.value = null
      lightsOn.value = false;
      loggingStatus.value = 'logging-in';
      
      setTimeout(()=>{
        api.authenticate(email.value,password.value).then( (sessionData)=>{
          store.commit('setSession',sessionData);
          store.commit('setGameId',game.value!.id);
        }).catch((err)=>{
          error.value = err;
        }).finally(()=>{
          if(error.value){
            // Se restablece el estado visual del formulario para hacer un retry
            loggingStatus.value = 'idle';
            lightsOn.value=true;
          }else{
            loggingStatus.value = 'logged';
            router.push({path:'/game/area'});
          }
        })
      },500)
      
      //api.authenticate()
    }

    return{
      lightsOn,bgImage,game,login,error,email,password,loggingStatus
    }
  },
})
</script>

<style lang="scss" scoped>

.login {
  height: 100%;
  //background-image:url('');
  background-position: center center;
  background-size: cover;
  color: white;
  //background-color:black;
  background-blend-mode: multiply;
  background-color:black;
  transition:background-color 250ms ease-in;
  &.lightsOn{
    background-color:#a0a0a0;
  }
}

h1 {
  margin: 0 0 10px 0;
  font-size: 1.2m;
  font-weight: bold;
}
.site-error{
  text-align: center;
  font-size:1.2em;
}
.responsive-container {
  height: 100%;
  display: flex;
  flex-flow: row wrap;
  justify-content: space-around;
  align-items: center;
}

.logo{
  width:100%; // EN firefox no se ve correctamente si no se pone
}
.registration-tip{
  text-align: center;
  margin-top:25px;
  a:link,a:visited{
    color:$site-secondary-color;
  }
  a:hover{
    color:$site-secondary-color-hover;
  }
}

.login-form{
  height:100%;
  padding:15px;
  
  margin-left:auto;
  margin-right:auto;
  display:flex;
  flex-flow:column nowrap;
  gap:15px;
  justify-content: center;
  background-color:rgba(0,0,0,0.4);
  
  transition: opacity 500ms ease-in;
  &.logging-in{
    opacity:0.2;
  }
  &.logged{
    opacity:0.0;
  }
}
.form-control{
  display:flex;
  flex-flow: column nowrap;
  gap:5px;
}


.form{
  display:flex;
  flex-flow:column nowrap;
  justify-content: center;
  flex-grow:2;
  gap:50px;
}
.controls{
  display:flex;
  flex-flow: column nowrap;
  gap:25px;
  justify-content: center;
  align-items: center;
}
label{
  font-size:1em;
}
@media(min-width:768px){
  .title{
    @include visible(block);
  }
  h1{
    font-size:4em;
  }
  .description{
    font-size:1.5em;
  }
  .login-form{
    align-items: center;
  }
  .form-control{
    width:300px;
  }
}
</style>