<template>
  <div class="home"  :style="{ backgroundImage: bgImage }" :class="{lightsOn}">
    <div class="responsive-container" v-if="selected">
      <div class="content">
        <div class="game-info">
          <div class="title">
            <h1>{{ selected.name }}</h1>
          </div>
          <div class="description">{{ selected.description }}</div>
          <div class="enter"><a href="#" class="button">Entrar</a></div>
        </div>
      </div>
      <div class="left">
        <a class="nav" href="#" @click="prev()"><fa icon="angle-left" /></a>
      </div>
      <div class="center" v-if="games">
        <div class="balls">
          <a class="nav"  href="#" v-for="(game, index) in games" :key="index" :class="{selected:index==selectedIndex}">
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

<script>
import { getGameList } from "@/game/services/gameApi";

export default {
  async mounted() {
    const list = await getGameList();
    this.games = list;
    this.selectedIndex = 0;
    this.bgImage = this.games[this.selectedIndex].image.url;
    this.select(0)
  },
  data() {
    return {
      games: [],
      selectedIndex: null,
      bgImage:null,
      lightsOn:false
    };
  },
  computed: {
    selected() {
      return this.selectedIndex != null ? this.games[this.selectedIndex] : null;
    }
  },
  methods: {
    select(i) {
      this.lightsOn = false;
      setTimeout( () => {
        this.selectedIndex = i >= 0 ? i % this.games.length : (this.games.length + i) % this.games.length;
        this.bgImage = 'url('+this.games[this.selectedIndex].image.url+')';
        this.lightsOn = true;
      },500);
    },
    prev(){ this.select(this.selectedIndex -1); },
    next(){ this.select(this.selectedIndex + 1); }
  },
};
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
  transition:background-color 500ms ease-in;

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