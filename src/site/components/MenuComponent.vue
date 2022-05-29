<template>
  <div class="menu">
    <div class="menu-background"></div>
    <div class="menu-holder">
      <nav class="header responsive-container">
        <div class="logo">
          <!--<img :src="logo" />-->
          <a href="#" @click="menuVisible = true" class="menu-opener"><fa icon="bars"/></a>
          <LogoComponent class="menu-logo"/>
          <!--<a href="/" class="brand">vendor<span>.com</span></a>-->
        </div>
        <Transition>
          <div class="side-menu" v-if="menuVisible">
            <div class="menu-veil"></div>
            <div class="menu-content">
              <div class="menu-closer">
                <a href="#"
                  ><fa icon="window-close" @click="menuVisible = false"
                /></a>
              </div>
              <div class="menu-links">
                <template v-for="(item, index) in links" :key="index">
                  <a :href="item.href"><fa :icon="item.icon" />{{ item.title }}</a>
                </template>
                  <a v-if="userIsLogged" href="#" @click="disconnect"><fa icon="sign-out" /> Cerrar sesión</a>
                  <router-link v-else to="/login/" @click="disconnect"><fa icon="sign-in" /> Iniciar sesión</router-link>
              </div>
            </div>
          </div>
        </Transition>
        <div class="menu-large menu-links">
          <template v-for="(item, index) in links" :key="index">
            <a :class="{ selected: item.id == selectedMenu }" :href="item.href"><fa :icon="item.icon" />{{ item.title }}</a>
          </template>
          <div class="user-menu">
            <router-link to="/player/games">{{username}}</router-link >
            <a title="Cerrar sesión" v-if="userIsLogged" href="#" @click="disconnect" ><fa icon="sign-out" /></a>
            <router-link v-if="!userIsLogged" to="/login/"><fa icon="sign-in" /> Iniciar sesión</router-link>
          </div>
        </div>
      </nav>
    </div>
  </div>
</template>

<script lang="ts">
import { useStore } from "@/store";
import { defineComponent } from "vue";
import LogoComponent from "@/site/components/LogoComponent.vue";
import { useRoute, useRouter } from "vue-router";
import { useGameAPI } from "@/game/services/gameApi";

const store = useStore();
const api = useGameAPI();

export default defineComponent({
  components:{LogoComponent},
  data() {
    return {
      links: [
        { id:'home', title: "Inicio", href: "/", icon: "home" },
        { id:'gamelist', title: "Lista de juegos", href: "/gamelist", icon: "list" }
      ],
      menuVisible: false,
    };
  },
  computed:{
    userIsLogged(){
      return store.state.user != null;
    },
    username(){
      return store.state.user?.nickname || store.state.user?.email || store.state.user?.id;
    },
    selectedMenu(){
      return store.state.selectedMenu;
    }
  },
  methods:{
    disconnect(){
      console.log("Usuario desconectado");
      api.logout().then( () => {
        store.commit('closeSession');
        store.commit('setGameId',null); // Importante, o el proximo login se meterá donde quiera!
        this.$router.push({path:"/"});
    });
    }
  }
});
</script>

<style lang="scss" scoped>
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.menu{
  width:100%;
  position:absolute;
  /** Cuando se superponen varios elementos con alfa < 1
    * ocurren cosas extrañas. Estableciendo el valor de z-index
    * hace que se comporte de la forma esperada y oculte todo lo
    * que haya por debajo. */
  //z-index:1; 
}
.menu-background{
  background-color: #303030;
  height:50px;
  opacity:0.9;
}
.menu-holder{
  position:absolute;
  width:100%;
  top:0px;
}
.header {
  height: 50px;
  margin-left:auto;
  margin-right:auto;
  display: flex;
  flex-flow: column nowrap;
}
a:link,
a:visited {
  color: white;
  text-decoration: none;
  &:hover {
    color: $site-primary-color;
    text-decoration: underline;
  }
}
.logo {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  gap: 25px;

.menu-opener {
    padding: 15px;
    border: 0px none;
    color: white;
    font-size: 2em;
    &:link,
    &visited {
      text-decoration: none;
      color: white;
    }
    &:hover {
      color: $site-primary-color;
    }
    &:focus {
      color: $site-secondary-color;
    }
  }
}
.menu-veil {
  position: fixed;
  width: 100vw;
  height: 100vh;
  top: 0;
  left: 0;
  background-color: black;
  opacity: 0.5;
}
.menu-content {
  position: fixed;
  top: 0;
  left: 0;
  right: 25px;
  bottom: 0;
  padding: 15px;
  margin: 0px;

  background-color: $site-background-color-dark;
  display: flex;
  flex-flow: row nowrap;
  align-items: left;
  justify-content: space-between;

  img {
    width: 32px;
    height: 32px;
  }
}
.menu-closer {
  order: 1;
  a:link,
  a:visited {
    color: white;
    font-size: 2em;
    &:hover {
      color: $site-primary-color;
    }
  }
}
.menu-links {
  display: flex;
  flex-flow: column nowrap;
  gap: 15px;
  font-size: 1.2em;
  a:link,
  a:visited {
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    gap: 15px;
  }
}

.menu-large {
  @include invisible;
}
.user-menu{
  display:flex;
  flex-flow: row nowrap;
  color:white;
  align-items: center;
  font-weight: bold;
  margin-left:50px;
}
@media (min-width: 1024px) {
  .menu-opener {
    @include invisible;
  }
  .header {
    flex-flow: row nowrap;
  }
  .logo {
    justify-content: flex-start;
    gap: 5px;
    img {
      @include visible(block);
    }
    .brand {
      flex-grow: 0;
    }
  }
  .menu-large {
    @include visible(flex);

    flex-flow: row nowrap;
    justify-content: flex-end;
    align-items: stretch;
    flex-grow: 1;
    margin-right: 15px;
    a {
      padding: 15px;

      &.selected {
        background-color: $site-primary-color;
        color:black;
      }
    }
  }
}
@media(min-width:1440px){
  .header{
      max-width: 1440px;
      margin-left:auto;
      margin-right:auto;
  }
}
</style>