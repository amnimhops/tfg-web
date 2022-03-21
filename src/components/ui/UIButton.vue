<template>
    <a href="#" class="ui-button" :title="description" :class="{justify,borderless,disabled,grow}" @click.prevent="$emit('onClick')">
        <slot></slot>
    </a>
</template>
<script>

export default {
    emits:["onClick"],
    props:{
        label:String,
        icon:String,
        justify:String, 
        description:{
            type:String,
            value:''
        },
        borderless:{
            type:Boolean,
            default:false
        },
        disabled:{
            type:Boolean,
            default:false
        },
        grow:{
            type:Boolean,
            default:false
        }
    },
    data(){
        return{
            active:false
        }
    }
    
    /*,
    setup(props,context) {
        context.
    }*/
}/*)*/
</script>

<style lang="scss" scoped>
    
    @mixin ui-control-layout{
        display:flex;
        flex-flow: row nowrap;
        justify-content: left;
        align-items: center;
        gap: 10px;

        &.center{
            justify-content: center;
        }
        &.flex-end{
            justify-content: flex-end;
        }
        &.space-around{
            justify-content: space-around;
        }
        &.space-between{
            justify-content: space-between;
        }
        &.borderless{
            border:0px none;
        }
    }

    .ui-button{
        @include ui-control-rounded();
        @include ui-control-layout();    

        background-color:$ui-control-foreground-color;
        color:$ui-control-font-color;
        
        font-family:$ui-control-font-family;
        
        padding:$ui-control-padding;
        user-select: none;
        &.grow{
           width:100%;
        }

        img{
            width:16px;
            height:16px;
        }
        
        &:hover{
            background-color:$ui-control-background-primary;
        }

        &:active{
            background-color:$ui-control-background-secondary;
            -webkit-tap-highlight-color:transparent;
            outline: 0 none;
        }
        &:link,&:visited{
            text-decoration: none;
        }
        &.disabled{
            pointer-events:none;
            filter:opacity(0.5);
        }
    }
</style>