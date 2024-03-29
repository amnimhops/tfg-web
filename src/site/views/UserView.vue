<template>
  <div
    class="game-list">
    <div class="responsive-container">
      <div class="game-info">
        <h1>Mis juegos</h1>

        <div class="results" v-if="list.length > 0">
          <div
            class="card"
            v-for="item in list"
            :key="item.id"
            :style="{ backgroundImage: `url('${item.media.image.url}')` }"
          >
            <h3>
              <router-link :to="`/view/${item.id}`">{{
                item.media.name
              }}</router-link>
            </h3>
          </div>
        </div>
        <div class="no-results" v-else>
          <h3>Actualmente no estás vinculado a ningún juego</h3>
          <router-link to="/gamelist" class="view-games button primary">Ver juegos disponibles</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, PropType, ref } from "vue";
import { Game, InstancePlayerInfo, SearchParams, SearchResult } from "server/monolyth";
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
    const games = ref<Record<string,Partial<Game>>>({});
    const list = ref<Partial<Game>[]>([]);
    const getUserGames = async (userId:string) => {
      console.log('wis')
      try{
        const all = await api.getGameList();
        const playing = await api.instanceInfo(userId);
        list.value = playing.map( g1 => all.find(g2 => g2.id == g1.gameId) );
      }catch(err){
        fatalError(err);
      }
    };

    onMounted(async () => {
      if(store.state.user){
        await getUserGames(store.state.user.id!);
      }else{
        router.push({path:"/login"});
      }
    });

    store.commit("enableMenuses", true);
    store.commit("selectMenu", "gamelist");

    return {list};
  },
});
</script>

<style lang="scss" scoped>
.game-list {
  height: 100%;
  color: white;
  background-color: #101010;
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
  margin-bottom: 0px;
}
.search .q {
  width: 100%;
}
.results {
  display: flex;
  flex-flow: column nowrap;
  gap: 15px;
}
.card {
  width: 100%;
  height: 150px;
  background-position: center center;
  background-size: 100% auto;
  border-radius: 5px;
  box-shadow: 2px 2px 2px black;
  opacity: 1;
  //  transition: opacity 500ms ease-in;
}
.card a:link,
a:visited {
  text-decoration: underline;
  color: inherit;
}
.card a:hover {
  color: $site-primary-color;
}
.card h3 {
  margin: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px;
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
  text-align: center;
  width: 100%;
}
.responsive-container {
  margin-top: 50px;
  height: 100%;
}
.pagination {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  gap: 5px;
  align-content: center;
}
.page {
  display: inline-block;
  border: 1px solid #0f0f0f;
  background-color: #303030;
  padding: 5px;
  width: 50px;
  border-radius: 5px;
  font-size: 1.5em;
  text-align: center;
  cursor: pointer;
}
.page.disabled {
  opacity: 0.5;
  pointer-events: none;
}
.pageof {
  font-size: 1.5em;
}
.page.number {
  @include invisible;
}
.page:hover,
.page.current {
  background-color: $site-primary-color;
  color: black;
}
.page.current:hover {
  background-color: $site-primary-color-hover;
}
.view-games{
  color:black;
  margin-top:25px;
}

@media (min-width: 1024px) {
  .responsive-container {
    width: 1024px;
  }
  .results {
    width: 100%;
    display: flex;
    flex-flow: row wrap;
  }
  .card {
    width: calc(50% - 10px);
  }
  .pagination {
    justify-content: center;
    gap: 15px;
  }
  .page.number {
    @include visible(inline-block);
  }
  .next,
  .prev,
  .pageof {
    @include invisible;
  }
}
</style>
