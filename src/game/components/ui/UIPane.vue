<template>
  <div class="ui-pane" :class="{rounded}">
      <slot></slot>
  </div>
</template>

<script>
export default {
    props:{
        rounded:{
            type:Boolean,
            default:false
        }
    }
}
</script>

<style lang="scss">
    .ui-pane{
        //border-radius: 15px;
        background-color: var(--ui-control-background-color);
        color: var(--ui-control-font-color);
        font-family: var(--ui-control-font-family);
        // Tamaño de fuente por defecto para los elementos de ventana
        font-size: var(--ui-control-text-size);
        // Selector para los encabezados
        .ui-heading{
            font-size:var(--ui-control-heading-size);
        }
        
        a.ui-link:link,a.ui-link:visited{
            color:var(--ui-control-font-color);
            text-decoration:underline;
            font-weight: bold;

        }
        a.ui-link:hover{
            color:var(--ui-control-background-primary)
        }

        &.rounded{
            @include ui-control-rounded;
        }
        input{
            font-family: var(--ui-control-font-family);
            font-size: var(--ui-control-text-size);
            border-color: var(--ui-control-border-color);
        }
    }

    .small{
        font-size:0.8em;
    }
    .large{
        font-size:1.2em;
    }
    .extra-large{
        font-size:2em;
    }

    ::-webkit-scrollbar{
        width:8px;
        background-color:var(--ui-control-shadow-color);
        }   
    ::-webkit-scrollbar-thumb{
        background-color:var(--ui-control-foreground-color);
    }
</style>