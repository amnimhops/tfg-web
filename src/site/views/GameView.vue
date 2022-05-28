<template>
  <div
    class="game-view"
    :style="{ backgroundImage: bgImage }"
    :class="{ lightsOn }">
    <div class="responsive-container"  v-if="game">
      <div class="game-info">
        <h1>{{ game.media.name }}</h1>
        <div class="game-attributes">
          <div class="description">{{ game.media.description }}</div>
          <div class="stats">
            <div class="stat">
              <div class="stat-header">Instancias</div>
              <div class="stat-value">{{ stats.instances }}</div>
            </div>
            <div class="stat">
              <div class="stat-header">Plazas</div>
              <div class="stat-value">
                {{ fmtResourceAmount(stats.maxPlayers) }}
              </div>
            </div>
            <div class="stat">
              <div class="stat-header">Usuarios</div>
              <div class="stat-value">
                {{ fmtResourceAmount(stats.players) }}
              </div>
            </div>
            <div class="stat">
              <div class="stat-header">Conectados</div>
              <div class="stat-value">
                {{ fmtResourceAmount(stats.connectedPlayers) }}
              </div>
            </div>
            <div class="stat">
              <div class="stat-header">Celdas</div>
              <div class="stat-value">{{ fmtResourceAmount(stats.cells) }}</div>
            </div>
            <div class="stat">
              <div class="stat-header">recursos únicos</div>
              <div class="stat-value">{{ stats.resources }}</div>
            </div>
            <div class="stat">
              <div class="stat-header">edificios únicos</div>
              <div class="stat-value">{{ stats.placeables }}</div>
            </div>
            <div class="stat">
              <div class="stat-header">tecnologías</div>
              <div class="stat-value">{{ stats.technologies }}</div>
            </div>
          </div>
          <div class="action">
            <a href="#" class="button primary" @click="action">Iniciar sesión</a>
          </div>
        </div>
        <!-- Aquí se iba a colocar una galería con controles interactivos, falta de tiempo... -->
        <div class="gallery">
          <a
            :href="asset.url"
            target="_blank"
            class="card"
            v-for="(asset, index) in game.gallery"
            :key="index"
          >
            <img :src="asset.url" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, PropType, ref } from "vue";
import { Game, GameStats } from "server/monolyth";
import { useGameAPI } from "@/game/services/gameApi";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "@/store";
import { randomItem } from "server/functions";
import { fatalError } from "../classes/utils";
import { fmtResourceAmount } from "server/functions";
export default defineComponent({
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const api = useGameAPI();
    const lightsOn = ref<boolean>(false);
    const game = ref<Partial<Game> | null>(null);
    const stats = ref<GameStats | null>(null);

    const bgImage = computed<string | null>(() => {
      if (game.value?.media) {
        return "url('" + game.value.media.image.url + "')";
      } else {
        return null;
      }
    });

    const action = () => {
      if (store.state.token) {
        console.log(game.value!.id);
        store.commit("setGameId", game.value?.id);
        router.push({ path: "/game/area" });
      } else {
        router.push({ path: `/login/${game.value!.id}` });
      }
    };

    store.commit("enableMenuses", true);

    onMounted(async () => {
      lightsOn.value = false;

      try{
        const currentGame = (await api.getGameList()).find(
          (g) => g.id == route.params.id
        );
        if(!currentGame) throw new Error("El juego " + route.params.id + " no se ha encontrado.");
        
        stats.value = await api.gameStats(currentGame.id!);
        game.value = currentGame;
      }catch(err){
        fatalError( "No ha sido posible cargar el juego: "+(err as Error).message);
      }
      
      lightsOn.value = true;
    });

    return { bgImage, lightsOn, action, game, stats, fmtResourceAmount };
  },
});
</script>

<style lang="scss" scoped>
.game-view {
  height: 100%;
  //background-image:url('');
  background-position: center center;
  background-size: cover;
  color: white;
  background-color: black;
  background-blend-mode: multiply;
  transition: background-color 250ms ease-in;
  //opacity:1;
  display: flex;
  flex-flow: column nowrap;
  height: 100%;
  &.lightsOn {
    background-color: #a0a0a0;
    //opacity:1;
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
  justify-content: space-around;
}

.stats {
  display: flex;
  flex-flow: row wrap;
  width:100%;
}
.stat {
  width: 50%;
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  margin-bottom: 5px;
  margin-top: 5px;
}
.stat-header {
  order: 1;
  font-size: 1.1em;
}
.stat-value {
  font-family:'Chakra Petch';
  font-size: 2em;
  font-weight: bold;
  order: 0;
}

.description {
  font-size: 1.2em;
}
h1 {
  font-size: 1.2m;
  font-weight: bold;
}
.game-attributes {
  display: flex;
  flex-flow: column nowrap;
  gap: 20px;
}
.gallery .card {
  display: flex;
  width: 100%;
  margin-bottom: 10px;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  height: 150px;
  box-shadow: 2px 2px 2px black;
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

  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-flow: row wrap;
  justify-content: space-around;
  align-items: center;
}

@media (min-width: 768px) {
  h1 {
    font-size: 4em;
    font-weight: bold;
  }
  .game-attributes {
    display: flex;
    flex-flow: row wrap;
    gap: 20px;
  }
  .gallery {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    gap: 0px;
  }
  .gallery .card {
    width: calc(50% - 5px);
    margin-bottom: 10px;
  }
  .stats{
    justify-content: space-between;
  }
  .stat {
    width:25%;
    flex-grow:1;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    margin-bottom: 20px;
  }
  .action{
    width:250px;
    margin-left:auto;
    margin-right:auto;
    margin-bottom:20px
  }
}
@media (min-width: 1024px) {
  
   .gallery .card {
      width: calc(33% - 5px);
   }

   .stat{
     width:25%;
   }
   .action{
     width:100%;
   }
   .stat-header {
      order: 1;
      font-size: 1.3em;
    }
    .stat-value {
      font-size: 2.5em;
      font-weight: bold;
      order: 0;
    }
   
}
</style>
