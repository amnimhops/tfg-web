<template>
  <div class="register" :style="{ backgroundImage: bgImage }">
    <form class="responsive-container" @submit.prevent="register">
      <div class="register-form" v-if="game" :class="registeringStatus">
        <LogoComponent class="logo"/>
        <div class="title"><h1>Crear cuenta</h1></div>
        <div class="controls">
          <div class="control-group-1">
            <div class="form-section">
              <div class="form-section-title p15"><h2>Datos del jugador</h2></div>
              <div class="form-section-body">
                <div class="form-group p15">
                  <div class="form-control">
                    <label for="nickname">Alias</label>
                    <input v-model="user.nickname" type="text" name="nickname" placeholder="Nombre en el juego" :class="classes['nickname']"  @input="validate"/>
                    <p class="site-error" v-if="error['nickname']">{{error['nickname']}}</p>
                  </div>
                  <div class="form-control">
                    <label for="password">Clave</label>
                    <input v-model="user.password" type="password" name="password" placeholder="Clave, al menos seis dígitos" :class="classes['password']"  @input="validate"/>
                    <p class="site-error" v-if="error['password']">{{error['password']}}</p>
                  </div>
                  <div class="form-control">
                    <label for="repassword">Repetir clave</label>
                    <input v-model="repassword" type="password" name="repassword" placeholder="Repite la clave" :class="classes['repassword']"  @input="validate"/>
                    <p class="site-error" v-if="error['repassword']">{{error['repassword']}}</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="form-section">
              <div class="form-section-title p15"><h2>Datos personales</h2></div>
              <div class="form-section-body">
                <div class="form-group p15">
                  <div class="form-control">
                    <label for="name">Nombre real</label>
                    <input v-model="user.name" type="text" name="name" placeholder="Tu nombre" :class="classes['name']" @input="validate"/>
                    <p class="site-error" v-if="error['name']">{{error['name']}}</p>

                  </div>
                  <div class="form-control">
                    <label for="surname">Apellidos</label>
                    <input v-model="user.surname" type="text" placeholder="Tus apellidos" :class="classes['surname']" @input="validate"/>
                    <p class="site-error" v-if="error['surname']">{{error['surname']}}</p>
                  </div>
                  <div class="form-control">
                    <label for="email">Email</label>
                    <input v-model="user.email" type="email" name="email" placeholder="Indica un mail válido" :class="classes['email']"  @input="validate"/>
                    <p class="site-error" v-if="error['email']">{{error['email']}}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="control-group-2">
            <div class="form-section">
              <div class="form-section-title p15"><h2>Avatar</h2></div>
              <div class="form-section-body">
                <div class="form-control p15">
                  <div class="portrait">
                    <img :src="portrait"/>
                  </div>
                  <label for="portrait-select"><fa icon="image" />Seleccionar una imagen</label>
                  <input type="file" @change="selectPortrait" name="portrait-select" id="portrait-select"/>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="control-group-3">
          <p class="site-error" v-if="fail">{{fail}}</p>
          <p class="site-info" v-if="registeringStatus == 'registering-in'">Registrando...</p>
          <button :disabled="!isValid" :class="{disabled:!isValid}" type="submit" class="button primary">Crear cuenta</button>
        </div>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, PropType, ref } from 'vue'
import { User, Game, RegistrationRequest, FileUpload } from 'server/monolyth';
import { useGameAPI } from '@/game/services/gameApi';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '@/store';
import { randomItem } from 'server/functions';
import { nonEmptyString, validMail} from 'backoffice/classes/validations'
import LogoComponent from '@/site/components/LogoComponent.vue';

const sections = ["Datos del jugador","Datos personales","Avatar"];
export default defineComponent({
  components:{LogoComponent},
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const api = useGameAPI();
    const fail = ref<string|null>(null);
    const error = ref<Record<string,string>>({
        'name':'',
        'surname':'',
        'nickname':'',
        'password':'',
        'repassword':'',
        'portrait':'',
        'email':''
    });
    const user = ref<User>({
      name:'',surname:'',email:'',password:'',privileges:[]
    });

    const classes  = computed<Record<string,string>>(()=>{
      const cls : Record<string,string> = {};
      for(const k in error.value){
        if(error.value[k]){
          cls[k] = 'invalid';
        }else{
          cls[k] = 'valid';
        }
      }
      return cls;
    });

    
    const game = ref<Partial<Game>|null>(null);
    const email = ref<string>('');
    const repassword = ref<string>('');
    const portrait = ref<string|null>(null);
    const portraitData = ref<string|null>();
    const portraitExt = ref<string|null>();
    const registeringStatus = ref<string>('');
    const section = ref<number>(0);
    const isValid = computed<boolean>(()=>{
      /* Un mensaje de error en cualquier propiedad significa que el formulario no es valido */
      for(const k in error.value){
        if(error.value[k]){
          return false;
        }
      }
      return true;
    });
    const bgImage = computed<string|null>( ()=> {
      return game.value != null ? 'url('+game.value.media!.image.url+')' : null
    });

    store.commit('enableMenuses',false);
    onMounted( async ()=>{
      // Sacamos una foto random de la lista y la cotejamos con el id (hipotético) facilitado
      const games = await api.getGameList();
      game.value = route.params.id ? (games.find( g => g.id == route.params.id)||null) : randomItem(games);
      console.log(game);
    });

    const next = ()=>{
      section.value = section.value+1;
      if(section.value == 3){ 
        console.log('registoroo')
      }
    }
    const prev = ()=>{
      section.value = Math.max(section.value-1,0);
    }
    const getImageExtension = (filename:string) => {
      const lastDot = filename.lastIndexOf(".");
      if(lastDot == -1) throw new Error("No se reconoce la extensión del archivo");
          
      const extension = filename.substr(filename.lastIndexOf(".")+1).toLowerCase();
      if(['jpg','jpeg','png','webp','svg'].indexOf(extension) == -1) throw new Error(`La extensión ${extension} no es válida`);

      return extension
    }

    const selectPortrait = (event:Event) => {
      const files = (event.target as HTMLInputElement).files || [];
      const file = files[0];
      try{
        if(!file) throw new Error("No se ha seleccionado ningún archivo");
        if(file.size > 5000000) throw new Error("Las imágenes deben ser inferiores a 5 megabytes");
        const extension = getImageExtension(file.name);
        portrait.value = URL.createObjectURL(file);
        
        // Sacamos la cadena b64 de la imagen para mandarla al servicio  de subidas
        const reader = new FileReader();
        reader.onloadend = (e:ProgressEvent)=>{
          portraitData.value = reader.result?.toString();
          console.log(reader.result);
        };
        
        reader.readAsDataURL(file);

      }catch(err){
        error.value['portrait'] = err as string;
      }
    }
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
        error.value['password'] = 'Longitud mínima seis dígitos';
      }
      if(user.value.password.length == 0){
        error.value['password'] = 'La clave está vacía';        
      }
      if(user.value.password != repassword.value){
        error.value['repassword'] = 'Las claves no coinciden';
      }
    }


    const register = async() => {
      registeringStatus.value = 'registering-in';
      fail.value = null;
      let avatar : FileUpload|null = null;

      if(portraitData.value){
        avatar = {
          type:portraitExt.value!,
          data:portraitData.value!
        };
      }
      const registrationRequest : RegistrationRequest = {
        user: user.value!,
        avatar:avatar
      };

      try{
        const auth = await api.register(registrationRequest);
        // Si todo ha ido bien, establecer la sesión
        store.commit('setSession',auth);
        // Si se registró con un ID de juego, se le lleva al juego
        // de lo contrario se le lleva a la lista d juegos
        if(route.params.id){
          store.commit('setGameId',route.params.id);
          router.push({path:'/game/area'});
        }else{
          router.push({path:'/gamelist'});
        }

      }catch(err){
        fail.value = err as string;
      }

      registeringStatus.value = 'idle';
    }


    validate();

    return{
      bgImage,game,register,
      classes,email,repassword,registeringStatus,
      user,validate,section,selectPortrait,portrait,
      next,prev,error,fail, isValid
    }
  },
})
</script>

<style lang="scss" scoped>
.logo{
  align-self:center;  
}
.register {
  height: 100%;
  //background-image:url('');
  background-position: center center;
  background-size: cover;
  color: white;
  //background-color:black;
  background-blend-mode: multiply;
  background-color:#a0a0a0;
}
/* Se elimina el padding que las secciones vayan a sangre, por lo hay que añadirlo elemento a elemento */
.p15{
  padding:15px;
}
h1 {
    font-size:2em;
    margin: 0 0 0 15px;
}
h2{
  margin:0px;
  font-size:1.2em;
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
  justify-content: flex-start;
  transition: opacity 500ms ;
  background-color:rgba(0,0,0,0.4);
}
.form-control{
  display:flex;
  flex-flow: column nowrap;
  width:100%;
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
.form-section{
  display:flex;
  flex-flow: column nowrap;
  justify-content: space-between;

}
.form-section-title{
  border-bottom:1px solid #505050;
}
.form-section-body{
  //background-color:rgba(0,0,0,0.5);
}
.portrait{
  display:flex;
  flex-flow: column nowrap;
  align-items: center;
  img{
    width:100%;
    height:auto;
  }
}
.submit{
  justify-content: center;
}
input[type=file]{
  @include invisible;
}

.controls{
  display:flex;
  flex-flow:column nowrap;
}
label{
  font-size:1em;
}
label[for="portrait-select"]{
  display:block;
  padding:10px;
  border-radius:5px;
  text-align:center;
  background-color:#404040;
  &:hover{
    background-color:darkgray;
  }
}

.invalid{
  border:3px solid $site-danger;  
}
.valid{
  border:3px solid $site-success;  
}
.control-group-3{
  margin:15px;
  margin-bottom:50px;
  text-align: center;
  
  button{
    width:100%;
  }
  .site-error{
    font-size:1.5em;
  }
}
@media(min-width:1024px){
  .title{
    @include visible(block);
  }
  h1{
    font-size:4em;
    margin: 0 0 0 15px;
    font-weight: bold;
  }
  .description{
    font-size:1.5em;
  }
  .login-form{
    align-items: center;
  }
  
  .controls{
    flex-flow: row nowrap;;
  }
  .control-group-1{
    display:flex;
    width:65%;
    flex-flow: row nowrap;
    .form-section{
      width:50%;
    }
    .form-control{
      gap:5px;
      width:100%;
      max-width:500px;
      flex-flow: row wrap;
      label{ order:0; }
      p    { order:1; width:calc(65% - 5px);flex-grow: 1;}
      input{ order:2; width:100%;}
    }
  }
  .control-group-2{
    width:35%;
    .form-section{
      height:100%;
    }
    .form-section-body{
      display:flex;
      flex-grow: 1;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
  }

  .control-group-3{
     display:flex;
     gap:20px;
     flex-direction: column;
     justify-content: center;
     align-items: center;
     .button{ width:300px;}
  }
  .responsive-container{
    height:100%;
  }
}
</style>
