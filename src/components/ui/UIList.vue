<template>
    <div v-for="(item,index) in items" :key="index" @click="select(index)" class="ui-list-item" :class="{selected:isSelected(index)}">
        <slot v-bind="item" ></slot>
    </div>

</template>

<script>
export default {
    props:['items','modelValue'],
    data(){
        return{
            index:null
        }
    },
    methods:{
        select(index){
            this.index = index;
            this.$emit("update:modelValue", this.items[this.index]);
        },
        isSelected(index){
            return this.index == index;
        }
    },
}
</script>

<style lang="scss" scoped>
    .ui-list-item{
        cursor:pointer;
        &:hover{
            background-color:$ui-control-background-primary;
        }
        &.selected,&:active{
            background-color:$ui-control-background-secondary;
        }    
    }
    
</style>