<template>
  <UIFlex direction="row" gap="10" padding="10" v-if="links">
    <template v-for="(link, index) in links" :key="index">
      <UILabel @onClick="navigateTo(link.href)" :link="index < links.length - 1" >{{ link.label }}</UILabel
      >
      <span v-if="index < links.length - 1"> / </span>
    </template>
  </UIFlex>
</template>

<script>
import UILabel from '../ui/UILabel.vue'
import UIFlex from '../ui/UIFlex.vue'
export default {
  props: ["links"],
  components:{UIFlex,UILabel}
};
</script>

<style>
</style>