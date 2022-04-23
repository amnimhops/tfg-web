<template>
  <div class="veil transparent black"></div>
  <div class="veil" @keydown.esc="close" tabindex="0" autofocus>
    <!-- Flex de centrado horizontal -->
    <UIFlex direction="row" justify-content="space-around" align-items="center" class="ui-modal-adjust">
        <UIPane class="ui-modal" rounded>
            <UIFlex justify-content="center" gap="10" padding="10">
                <UIFlex direction="row" align-items="center" gap="10">
                    <UIButton description="Cerrar esta ventana modal" @onClick="close" borderless>
                        <UIIcon :src="closeIcon" size="medium" />
                    </UIButton>
                    <span class="ui-heading">{{ title }}</span>
                </UIFlex>
                <!-- Contenido -->
                <UIFlex class="scrollable"><slot name="content"></slot></UIFlex>
                <!-- Botonera al pie -->
                <UIFlex>
                    <slot name="footer"></slot>
                </UIFlex>
            </UIFlex>
        </UIPane>

    </UIFlex>
  </div>
</template>

<script>
import UIFlex from "@/game/components/ui/UIFlex.vue";
import UIButton from "@/game/components/ui/UIButton.vue";
import UIIcon from "@/game/components/ui/UIIcon.vue";
import UIPane from "@/game/components/ui/UIPane.vue";
import { closeIcon } from "@/game/components/ui/icons";
export default {
  components: { UIFlex, UIButton, UIIcon, UIPane },
  props: ["title"],
  emits: ["onClose"],
  data() {
    return {
      closeIcon,
    }
  },
  methods:{
      close(){
          this.$emit('onClose')
      }
  }
};
</script>

<style lang="scss" scoped>
.veil {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  /* Este componente tiene la máxima prioridad de visibilidad */
  z-index: 999;
  &.transparent {
    opacity: 0.6;
  }
  &.black {
    background-color: black;
  }
  .ui-modal-adjust{
    position:relative;
    top:105px;
    >.ui-pane{
      width:100%;
      border-radius:0;
      height:100vh;
    }
  }
  .scrollable{
      overflow-y:auto;
      // TODO: Esto DEBE ser dependiente del media-query
      max-height:400px;
  }
}
@media(min-width:768px){
  .ui-modal-adjust{
    height: 100vh;
  }   
}
</style>