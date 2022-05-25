<template>
  <div class="register" :style="{ backgroundImage: bgImage }" :class="{lightsOn}">
    <form class="responsive-container" @submit.prevent="checkForm">
      <div class="register-form" v-if="game" :class="registeringStatus">
        <div class="title"><h1>Crear cuenta</h1></div>
        <div class="controls">
          <div class="fields">
            <div class="form-group">
              <div class="form-control">
                <label for="name">Nombre real</label>
                <input v-model="user.name" type="text" name="name" placeholder="Tu nombre" @change="validate"/>
                <p class="error" v-if="error['name']">{{error['name']}}</p>
              </div>
              <div class="form-control">
                <div class="form-control">
                  <label for="name">Apellidos</label>
                  <input v-model="user.surname" type="text" name="name" placeholder="Tus apellidos"  @change="validate"/>
                  <p class="error" v-if="error['surname']">{{error['surname']}}</p>
                </div>
              </div>
              <div class="form-control">
                <label for="nickname">Nombre de usuario</label>
                <input v-model="user.nickname" type="text" name="nickname" placeholder="Tu nombre de jugador"  @change="validate"/>
                <p class="error" v-if="error['nickname']">{{error['nickname']}}</p>
              </div>
            </div>
            <div class="form-group">
              <div class="form-control">
                <label for="nickname">Correo electrónico</label>
                <input v-model="user.email" type="email" name="email" placeholder="Introduce tu email"  @change="validate"/>
                <p class="error" v-if="error['email']">{{error['email']}}</p>
              </div>
              <div class="form-control">
                <label for="password">Clave</label>
                <input v-model="user.password" type="password" name="password" placeholder="Introduce una clave"  @change="validate"/>
                <p class="error" v-if="error['password']">{{error['password']}}</p>
              </div>
              <div class="form-control">
                <label for="repassword">Repetir clave</label>
                <input v-model="repassword" type="password" name="repassword" placeholder="Repite la clave"  @change="validate"/>
                <p class="error" v-if="error['repassword']">{{error['repassword']}}</p>
              </div>
            </div>
          </div>
          <div class="portrait">
            <img />
          </div>
          <div class="form-control">
            <button type="submit" class="button">Entrar</button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, PropType, ref } from 'vue'
import { User, Game } from 'server/monolyth';
import { useGameAPI } from '@/game/services/gameApi';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '@/store';
import { randomInt } from '@/shared/_functions';
import { randomItem } from 'server/functions';
import { nonEmptyString, validMail} from 'backoffice/classes/validations'

export default defineComponent({
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const api = useGameAPI();
    const error = ref<Record<string,string>>({
        'name':'',
        'surname':'',
        'nickname':'',
        'password':'',
        'repassword':'',
        'email':''
    });
    const user = ref<User>({
      name:'',surname:'',email:'',password:'',privileges:[]
    });

    const lightsOn = ref<boolean>(false);
    const game = ref<Partial<Game>|null>(null);
    const email = ref<string>('');
    const repassword = ref<string>('');
    const registeringStatus = ref<string>('');

    const bgImage = computed<string|null>( ()=> {
      return game.value != null ? 'url('+game.value.media!.image.url+')' : null
    });

    onMounted( async ()=>{
      // Sacamos una foto random de la lista
      const games = await api.getGameList();
      game.value = randomItem(games);
      console.log(game);
      lightsOn.value = true;
    });

    const validate = async ()=>{
      // Aprovechamos que la api tiene que validar usuario y email
      // para que lo valide todo: otro marrón satisfactoramente evadido.
      const errors = await api.validateUser(user.value);
      for(const k in error.value) {
        // Hay que poner los errores, pero también quitar los antiguos!
        if(errors[k]) error.value[k] = errors[k];
        else error.value[k] = '';
      }
      if(!validMail(user.value.email)) error.value['email'] = 'El email no es válido';
      // Las claves las validamos in situ
      if(user.value.password.length < 6){
        error.value['password'] = 'La clave debe tener al menos seis dígitos';
      }
      if(user.value.password != repassword.value){
        error.value['repassword'] = 'Las claves no coinciden';
      }
    }

    const login = () => {
     // error.value = null
      lightsOn.value = false;
      registeringStatus.value = 'registering-in';
      
      /*setTimeout(()=>{
        api.authenticate(email.value,password.value).then( (sessionData)=>{
          store.commit('setSession',sessionData);
          store.commit('setGameId',game.value!.id);
        }).catch((err)=>{
          error.value = err;
        }).finally(()=>{
          if(error.value){
            // Se restablece el estado visual del formulario para hacer un retry
            registeringStatus.value = 'idle';
            lightsOn.value=true;
          }else{
            registeringStatus.value = 'registered';
            router.push({path:'/game/area'});
          }
        })
      },500)*/
    }

    return{
      lightsOn,bgImage,game,login,error,email,repassword,registeringStatus,user,validate
    }
  },
})
</script>

<style lang="scss" scoped>

.portrait{
  height:100px;
  background-color:red;
}
.register {
  padding-top:50px;
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
  font-size: 1.5m;
  font-weight: bold;
}
p.error{
  color:$site-danger;
  background-color:$site-danger;
  color:$site-front-color;
  opacity:0.9;
  border-radius:5px;
  margin:0px;
  padding-left:5px;
}
.responsive-container {
  height: 100%;
  display: flex;
  flex-flow: row wrap;
  justify-content: space-around;
  align-items: center;
}

.title{
  font-size:1.2em;
}
.register-form{
  width:90%;
  height:100%;
  margin-left:auto;
  margin-right:auto;
  display:flex;
  flex-flow:column nowrap;
  gap:15px;
  justify-content: center;
  transition: opacity 500ms ease-in;
  background-color:rgba(0,0,0,0.5);
  padding:15px;
  
  &.register-in{
    opacity:0.2;
  }
  &.registered{
    opacity:0.0;
  }
}
.form-control{
  display:flex;
  flex-flow: column nowrap;
  gap:5px;
}
.form-group{
  display:flex;
  flex-flow: column nowrap;
  gap:20px;
  margin-bottom:20px;
}
.form-control a{
  margin-top:25px;
  text-align: center;
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
  .form-group{
    display:flex;
    flex-flow: row nowrap;
  }
}
</style>