<template>
    <div class="ui-dropdown" :class="classes" @mouseleave="close" @keydown="key" @click="toggle">
        <div class="header">
            <div class="ui-dropdown-item selected" >
                <slot name="selected" v-bind="selected"></slot>
            </div>
            <div class="chevron"></div>
        </div>
        <div class="items">
            <div class="ui-dropdown-item" v-for="(item,ndx) in data" :key="ndx" @click.stop="select(ndx)">
                <slot v-if="ndx!=selectedIndex" name="item" v-bind="item"></slot>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props:{
        data:Array,
        index:{
            type:Number,
            default:0
        },
        padding:String
    },
    data(){
        return {
            selectedIndex:0,
            opened:false
        }
    },
    methods:{
        toggle(){
            this.opened = !this.opened;
        },
        close(){
            this.opened = false;
        },
        key(k){
            console.log(k);
        },
        select(index){
            console.log('selection dd',index)
            this.selectedIndex = index;
            this.opened = false;
            this.$emit("change",this.selectedIndex);
        }
    },
    computed:{
        selected(){
            console.log(this.data[this.selectedIndex]);
            return this.data[this.selectedIndex];
        },
        classes(){
            const styles =  [];
            if(this.opened) styles.push('opened');
            if(this.padding) styles.push('pad-'+this.padding);
            return styles;
        }
    },
    watch:{
        index(newIndex) {
            this.selectedIndex = newIndex;
        }
    }
}
</script>

<style lang="scss" scoped>
    .ui-dropdown{
        cursor:pointer;
        @include ui-control-rounded();
        overflow:hidden;
        background-color:$ui-control-foreground-color;
        .header{
            display:flex;
            flex-flow: row nowrap;
            align-items: center;
            .selected{
                flex-grow:1;
            }
            .chevron{
                width:32px;
                height:32px;
                margin:5px;
                background-image: url('../../../assets/ui/icon-chevron-down.svg');
            }
        }
        .header:hover{
            background-color: $ui-control-background-primary;
        }
        
        
        .items{
            display:none;//flex-grow: 1;
            visibility: hidden;
        }
        &.opened .items{
            display:flex;
            flex-flow: column nowrap;
            gap:10px;
            visibility: visible;
        }        

        &.opened{
            overflow: hidden; // Esto evita que el fondo seleccionado del item sobresalga de los bordes redondos
            
            .header{
                background-color: transparent;
            }
            .chevron{
                transform:rotate(180deg);
                top:-10px;
            }
            .ui-dropdown-item{
                display:block;
                visibility:visible;  
                &:hover{
                    background-color: $ui-control-background-primary;
                }
            }
        }
    }
    
        

</style>