<template>
  <div
    class="game-list"
    :style="{ backgroundImage: bgImage }"
    :class="{ lightsOn }">
    <div class="responsive-container" v-if="game">
      <div class="game-info">
        <h1>Títulos disponibles</h1>
        <div class="search">
            <form @submit.prevent="search">
                <input class="q" type="search" v-model="q" placeholder="Introduce una palabra para comenzar la búsqueda" />
            </form>
        </div>
        <div class="results" v-if="list.length>0">
            <div class="card" v-for="item in list" :key="item.id" :style="{backgroundImage:`url('${item.media.image.url}')`}" :class="{searching}">
                <h3><router-link :to="`/view/${item.id}`">{{item.media.name}}</router-link></h3>
            </div>
        </div>
        <div class="no-results" v-else>
            <h3>La búsqueda no ha producido ningún resultado</h3>
        </div>
        <div class="pagination" v-if="pages.length > 1">
            <a class="page prev" :class="{disabled:(page==1)}" @click="goPage(page-1)"><fa icon="angle-left" /></a>
            <span class="pageof">{{page}} / {{pages.length}}</span>
            <a class="page next" :class="{disabled:(page==pages[pages.length-1])}" @click="goPage(page+1)"><fa icon="angle-right" /></a>
            <a class="page number" :class="{current:p==page}" v-for="p in pages" :key="p" @click="goPage(p)">{{p}}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, PropType, ref } from "vue";
import { Game, SearchParams, SearchResult } from "server/monolyth";
import { useGameAPI } from "@/game/services/gameApi";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "@/store";
import { randomItem } from "server/functions";
import { fatalError } from "../classes/utils";
import { paginate } from "server/functions";

export default defineComponent({
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const api = useGameAPI();
    const lightsOn = ref<boolean>(false);
    const game = ref<Partial<Game> | null>(null);

    const page = ref<number|undefined>();
    const pages = ref<number[]>([]);
    const q = ref<string>('');
    const list = ref<Partial<Game>[]>([]);
    const searching = ref<boolean>(false);
    const bgImage = computed<string | null>(() => {
      if (game.value?.media) {
        return "url('" + game.value.media.image.url + "')";
      } else {
        return null;
      }
    });

    const search = async () => {
        searching.value = true;
        page.value = page.value || 1;
        const params : SearchParams = {
            criteria:{ "media.name" : {"$regex":`.*${q.value}.*` }},
            page:page.value,
            records:3,
            sortField:"media.name",
            sortOrder:1
        };

        const result = await api.searchGames(params);

        list.value = result.results;
        page.value = result.page;
        pages.value = paginate(page.value,1,result.pages,5);

        searching.value = false;
    }

    const goPage = async (p:number) => {
        // Evitamos navegar a una pagina que no exista.
        if(pages.value!.some( page => page == p)){
            page.value = p;
            await search();
        }
        
    }

    onMounted(async () => {
      lightsOn.value = false;

      const currentGame = randomItem(await api.getGameList());
      game.value = currentGame;
      
      await search();

      lightsOn.value = true;
    });

    store.commit("enableMenuses", true);
    store.commit("selectMenu","gamelist");
    
    return { game,bgImage, lightsOn, search, list, q, page, pages, goPage, searching};
  },
});
</script>

<style lang="scss" scoped>
.game-list {
  height: 100%;
  //background-image:url('');
  background-position: center center;
  background-size: cover;
  color: white;
  background-color: black;
  background-blend-mode: multiply;
  transition: background-color 500ms ease-in-out;
  display: flex;
  flex-flow: column nowrap;
  &.lightsOn {
    background-color: #a0a0a0;
  }
}

.game-info {
  background-color: rgba(0, 0, 0, 0.4);
  width: 100%;
  height: 100%;
  padding: 15px;
  gap: 25px;
  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
}

h1 {
  font-size: 1.2m;
  font-weight: bold;
  margin-bottom:0px;
}
.search .q{
    width:100%;
}
.results{
    display:flex;
    flex-flow: column nowrap;
    gap:15px;
}
.card {
  width: 100%;
  height:150px;
  background-position: center center;
  background-size:100% auto;
  border-radius:5px;
  box-shadow: 2px 2px 2px black;
  opacity:1;
//  transition: opacity 500ms ease-in;
}
.card a:link, a:visited{
    text-decoration:underline;
    color:inherit;  
}
.card a:hover{
    color:$site-primary-color;
}
.card h3{
    margin:0;
    width:100%;
    background-color:rgba(0,0,0,0.7);
    color:white;
    padding:5px;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
}
.gallery .card:hover {
  border: 1px solid $site-primary-color;
}
.gallery img {
  max-width: 100%;
  height: cover;
}
.action {
  text-align:center;
  width: 100%;
}
.responsive-container {
  margin-top: 50px;
  height: 100%;
 
}
.pagination{
    display:flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    gap:5px;
    align-content: center;

}
.page{
    display:inline-block;
    border:1px solid #0f0f0f;
    background-color:#303030;
    padding:5px;
    width:50px;
    border-radius: 5px;
    font-size:1.5em;
    text-align: center;
    cursor:pointer;
}
.page.disabled{
    opacity:0.5;
    pointer-events: none;
}
.pageof{
    font-size:1.5em;
}
.page.number{
    @include invisible;
}
.page:hover,.page.current{
    background-color:$site-primary-color;
    color:black;
}
.page.current:hover{
    background-color:$site-primary-color-hover;
}
.next,.prev,.pageof{
 
}

@media (min-width: 1024px) {
    .responsive-container{
        width:1024px;
    }
    .results{
        width:100%;
        display:flex;
        flex-flow: row wrap;
    }
    .card{
        width:calc(50% - 10px);
    }
    .pagination{
        justify-content: center;
        gap:15px;
    }
    .page.number{
        @include visible(inline-block)
    }
    .next,.prev,.pageof{
        @include invisible;
    }

}
</style>
