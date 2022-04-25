<template>
    <div class="ui-progressbar">
        <div class="progress" :style="{width:percentCompleted}"></div>
        <p class="label">{{label}}</p>
    </div>
</template>

<script>
export default{
    props:["value","max","label"],
    computed:{
        percentCompleted(){
            return (100*(this.value/this.max))+"%";
        }
    }
}
</script>


<style lang="scss" scoped>
.ui-progressbar{
    .rounded{
        @include ui-control-rounded;
    }

    .progress{
        background-color: $ui-control-background-secondary;
        height:100%;
        min-height: 2em;
    }
    .label{
        position:relative;
        margin:0;
        top:-1.5em;
        text-align:center;
    }
}
</style>