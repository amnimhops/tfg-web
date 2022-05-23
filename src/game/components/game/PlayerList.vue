<template>
  <UIPane class="player-list">
    <UIFlex gap="15">
      <UIFlex direction="row" class="header" justifyContent="space-between">
        <UILabel class="xs-12 md-8">Nombre</UILabel>
        <UILabel class="hidden-sm-down md-2">Nivel tec.</UILabel>
        <UILabel class="hidden-sm-down md-2">Edificios</UILabel>
      </UIFlex>
      <UIFlex gap="5">
        <UIFlex direction="row" v-for="(player,idx) in players" :key="idx" justifyContent="space-between">
          <UILabel class="xs-12 md-8" link @onClick="playerSelected(player)">{{player.media.name}}:{{player.position}}</UILabel>
          <UILabel class="hidden-sm-down md-2">{{player.techLevel || '???'}}</UILabel>
          <UILabel class="hidden-sm-down md-2">{{player.buildings || '???'}}</UILabel>
        </UIFlex>
      </UIFlex>
    </UIFlex>
  </UIPane>
</template>

<script lang="ts">

import { WorldPlayer } from 'server/monolyth';
import { defineComponent, PropType } from 'vue';
import * as UI from '../ui/'
export default defineComponent({
    props:{
        players:Object as PropType<WorldPlayer[]>
    },
    components:{...UI},
    emits:['onPlayerSelected'],
    setup(props,{emit}) {
      const playerSelected = (player:WorldPlayer) => {
        emit('onPlayerSelected',player);
      };

      return {playerSelected}
   }
});
</script>


<style lang="scss" scoped>
  .header{
    font-weight:bold;

  }
</style>