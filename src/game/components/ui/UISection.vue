<template>
    <div class="ui-section">
        <span class="ui-section-title">{{title}}</span>
        <div class="ui-section-body">
            <slot></slot>
        </div>
    </div>
</template>

<script>

export default {
    props:["title"]
}
</script>

<style lang="scss" scoped>
    .ui-section-body{
        padding-left:5px;
        border-left:1px solid $ui-control-border-color;
    }
    .ui-section-title{
        font-weight:bold;
        font-size:1.2em;
        margin-bottom:5px;
        display:block;
    }
</style>