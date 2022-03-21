<template>
  <img class="ui-icon" :src="src" :class="size" :title="title"/>
</template>

<script>
export default {
    props:{
        src:String,
        size:{
            type:String,
            default:'small'
        },
        title:{
            type:String,
            default:'icon image'
        }
    }
}
</script>

<style lang="scss">
    .ui-icon{
        color:red;
        &.small{
            width:16px;
            height:16px;
        }
        &.medium{
            width:32px;
            height:32px;
        }
        &.large{
            width:64px;
            height:64px;
        }
    }
</style>