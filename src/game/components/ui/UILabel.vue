<template>
    <span v-if="link==false" class="ui-label" :title="title"><slot></slot></span>
    <a v-else class="ui-label ui-link" href="#" @click.prevent="this.$emit('onClick');" :title="title"><slot></slot></a>
</template>

<script>
export default {
    emits:["onClick"],
    props:{
        align:{
            type:String,
            default:'left'
        },
        link:{
            type:Boolean,
            default:false
        },
        title:{
            type:String,
            default:''
        },
        size:{
            // small,large,extra-large
            type:String,
            default:''
        }
    }
}
</script>

<style lang="scss" scoped>
    
</style>