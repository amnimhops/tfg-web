<template>
  <Teleport to="body">
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
  </Teleport>
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
    >.ui-pane{
      width:100%;
      border-radius:5px;
      height:100vh;
      >.ui-flex{
        height:100%;
        justify-content: space-between;
      }
    }
  }
  .scrollable{
      flex-grow:1;
      overflow-y:auto;
  }
}
@media(min-width:768px){
  .veil{
    .ui-modal-adjust{
      >.ui-pane{
        border-radius:$ui-control-border-radius;
        /*margin:25px;
        height:calc(100vh - 50px);*/
        max-height:calc(100vh - 100px);
        width:auto;
        margin:50px auto 50px auto;
        >.ui-flex{
          height:100%;
          justify-content: space-between;
        }
      }
    }   
  }
}
</style>