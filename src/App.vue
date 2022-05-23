<template>
  <router-view></router-view>
</template>

<script lang="ts" setup>
import { defineComponent, onMounted } from 'vue';
import { useStore } from './store';
import { useGameAPI } from './game/services/gameApi';

const store = useStore();

onMounted(()=>{
  // Comprobar si vuex mantiene info del usuario e inicializar la API
  if(store.state.token){
    useGameAPI().setToken(store.state.token);
  }
  
  console.log(document.cookie);
})
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Saira+Semi+Condensed&display=swap');


body{
  margin:0px;
  padding:0px;
}

#app {
font-family: 'Saira Semi Condensed', sans-serif;  

}
</style>
