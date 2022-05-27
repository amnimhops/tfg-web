<template>
  <div class="home"  :style="{ backgroundImage: bgImage }" :class="{lightsOn}">
    <div class="responsive-container" v-if="selected">
      <div class="content">
        <div class="game-info">
          <div class="title">
            <h1>{{ selected.media.name }}</h1>
          </div>
          <div class="description">{{ selected.media.description }}</div>
          <div class="enter"><a href="#" class="button primary" @click="viewGame">Entrar</a></div>
        </div>
      </div>
      <div class="game-nav">
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
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import { Game } from 'server/monolyth';
import { useGameAPI } from '@/game/services/gameApi';
import { useStore} from '@/store'
import { useRouter } from 'vue-router';
import {fatalError} from "@/site/classes/utils"
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

    const viewGame = ()=>{
      router.push({path:'/view/'+selected.value!.id});
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
      try{
        games.value = await api.getGameList();
        select(0);
      }catch(err){
        fatalError(err);
      }
      
    });

    store.commit('enableMenuses',true);
    return{
      lightsOn,bgImage,games,selected,selectedIndex,
      prev,next,select,viewGame
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
  padding: 15px;
}
.game-nav{
  display:flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
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
  width:min(300px,100%);
  margin-left:auto;
  margin-right:auto;
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
  color:lightgray;
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