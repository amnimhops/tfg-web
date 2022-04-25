<template>
    <a href="#" class="ui-button" :title="description" :class="classes" @click.prevent="$emit('onClick')">
        <slot></slot>
    </a>
</template>
<script>

export default {
    emits:["onClick"],
    props:{
        label:String,
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
        },
        rounded:{
            type:Boolean,
            default:true
        }
    },
    data(){
        return{
            active:false
        }
    },
    computed:{
        classes(){
            const classes = [];
            if(this.borderless) classes.push('borderless');
            if(this.disabled) classes.push('disabled');
            if(this.rounded) classes.push('rounded');
            if(this.grow) classes.push('grow');
            if(this.justify) classes.push(this.justify);
            

            return classes;
        }
    }
    
    /*,
    setup(props,context) {
        context.
    }*/
}/*)*/
</script>

<style lang="scss" scoped>
    
    .ui-button{
        display:flex;
        flex-flow: row nowrap;
        justify-content: left;
        align-items: center;
        gap: 10px;
        background-color:$ui-control-foreground-color;
        color:$ui-control-font-color;
        
        font-family:$ui-control-font-family;
        
        padding:$ui-control-padding;
        user-select: none;

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
        
        &.rounded{
            @include ui-control-rounded();
        }
        &.borderless{
            border:0px none;
        }  
        
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

        &:active, .active{
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