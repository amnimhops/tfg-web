<template>
  <div class="home"  :style="{ backgroundImage: bgImage }" :class="{lightsOn}">
    <div class="responsive-container" v-if="selected">
      <div class="content">
        <div class="game-info">
          <div class="title">
            <h1>{{ selected.media.name }}</h1>
          </div>
          <div class="description">{{ selected.media.description }}</div>
          <div class="enter"><a href="#" class="button" @click="joinGame">Entrar</a></div>
        </div>
      </div>
      <div class="left">
        <a class="nav" href="#" @click="prev()"><fa icon="angle-left" /></a>
      </div>
      <div class="center" v-if="games">
        <div class="balls">
          <a class="nav"  href="#" v-for="(game, index) in games" :key="index" :class="{selected:index==selectedIndex}" @click="select(index)">
            <fa icon="circle" />
          </a>
        </div>
        <div class="numbers">
          <span>{{ selectedIndex + 1 }} / {{ games.length }}</span>
        </div>
      </div>
      <div class="right">
        <a class="nav" href="#" @click="next()"><fa icon="angle-right" /></a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import {Game} from 'server/monolyth';
import { useGameAPI } from '@/game/services/gameApi';
import {useStore} from '@/store'
import { useRoute, useRouter } from 'vue-router';

export default defineComponent({
  setup() {
    const store = useStore();
    const router = useRouter();
    const api = useGameAPI();
    const games = ref<Partial<Game>[]>([]);
    const selectedIndex = ref<number|null>(null);
    const selected = computed<Partial<Game>|null>(()=> {
      if(games.value && selectedIndex.value != null) return games.value[selectedIndex.value];
      else return null;
    });

    const lightsOn = ref<boolean>(false);
    const bgImage = computed<string|null>(
      ()=> (games.value && selectedIndex.value != null) ? 'url('+games.value[selectedIndex.value].media!.image.url+')' : null
    );

    const joinGame = ()=>{
      if(store.state.token){
        store.commit('setGame',selected.value?.id);
        router.push({path:'/game/area'})
      }else{
        router.push({path:`/game/${selected.value?.id}/login`})
      }
    }
    const select = (index:number) => {
      lightsOn.value = false;
      setTimeout(()=>{
        selectedIndex.value = index >= 0 ? index % games.value.length : (games.value.length + index) % games.value.length;
        lightsOn.value = true;
        console.log(games.value[selectedIndex.value])
      },500);
    }
    
    const prev = () => select( (selectedIndex.value ||0) - 1);
    const next = () => select( (selectedIndex.value ||0) + 1);
    onMounted( async ()=>{
      games.value = await api.getGameList();
      console.log(games);
      select(0);
    });

    return{
      lightsOn,bgImage,games,selected,selectedIndex,
      prev,next,select,joinGame
    }
  },
})
</script>

<style lang="scss" scoped>

.home {
  padding-top:100px;
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

.responsive-container {
  height: 100%;
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
}
.left {
  font-size: 4em;
}
.right {
  font-size: 4em;
}

.content {
  width: 100%;
}

.description {
  overflow-y: auto;
}
.enter{
  margin-top:30px;
  width:100%;
  display:flex;
  flex-flow: row nowrap;

  .button{
    text-align: center;
    font-weight: bold;
    flex-grow:1;
  }
}
.balls{
  @include invisible;
}
.numbers{
  font-size:1.5em;
}
.nav:link,.nav:visited{
  color:gray;
  &:hover{
    color:white;
  }
}
.nav.selected{
  color:$site-primary-color;
}

@media(min-width:1024px){
  .balls{
    @include visible(flex);
    
    display:flex;
    flex-flow: row nowrap;
    justify-content: space-around;
    align-items: center;
    width:300px;
  }
  .numbers{
    @include invisible;
  }
  h1{
    font-size:4em;
  }
  .description{
    font-size:1.5em;
  }
  .enter{
    justify-content: center;
    .button{
      width:300px;
      flex-grow:0;
    }
  }
}
</style>