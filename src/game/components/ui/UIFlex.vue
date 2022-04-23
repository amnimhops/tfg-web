<template>
  <div class="ui-flex" :class="classes"><slot></slot></div>
</template>

<script>
export default {
    props:{
        direction:{
            type:String,
            default:'col'
        },
        wrap:{
            type:Boolean,
            default:false
        },
        /**
         * Uno de los paddings disponibles: 1 2 3 5 10 20;
         */
        padding:String,
        /**
         * Determina la separación entre items, idem que padding
         */
        gap:String,
        justifyContent:{
            type:String,
            default:'flex-start'
        },
        grow:{
            type:Boolean,
            default:false
        },
        alignItems:String
    },
    computed:{
        classes(){
            const styles =  [this.direction,'justify-'+this.justifyContent];
            if(this.alignItems) styles.push('align-'+this.alignItems);
            if(this.gap) styles.push('gap-'+this.gap);
            if(this.padding) styles.push('pad-'+this.padding);
            if(this.wrap) styles.push('wrap');
            if(this.grow) styles.push('grow');
            return styles;
        }
    }
}
</script>

<style lang="scss" scoped>
    .ui-flex{
        display:flex;
        flex-direction: column;
        
        &.wrap{
            flex-wrap: wrap;
        }
        &.grow{
            flex-grow: 1;
        }
        &.col{
            //height:100%;
        }
        &.row{
            flex-direction: row;
        }
        &.justify-space-around{
            justify-content: space-around;
        }
        &.justify-space-between{
            justify-content: space-between;
        }
        &.justify-flex-start{
            justify-content: flex-start;
        }
        &.justify-flex-end{
            justify-content: flex-end;
        }
        &.align-flex-start{
            align-items: flex-start;
        }
        &.align-flex-end{
            align-items: flex-end;
        }
        &.align-center{
            align-items: center;
        }
        &.align-stretch{
            align-items: stretch;
        }
    }
</style>