<template>
  <UIModal title="Seleccionar estructura" @onClose="this.$emit('onClose')">
    <template v-slot:content>
      <UIFlex gap="10">
        <UIList :items="structures" v-model="selectedItem">
          <template v-slot="item">
            <UIFlex direction="row" gap="10" padding="5" justify-content="flex-start">
              <img class="ui-image" :src="item.image.url" />
              <UIFlex gap="10">
                <span class="ui-heading">{{item.name}}</span>
                <p>{{item.description}}</p>
              </UIFlex>
            </UIFlex>
          </template>
        </UIList>
      </UIFlex>
    </template>
    <template v-slot:footer>
      <UIFlex direction="row" justify-content="space-around" align-items="center">
        <UIButton :disabled="selectedItem==null" @onClick="select"><UIIcon :src="acceptIcon" size="medium" /><span>Seleccionar</span></UIButton>
      </UIFlex>
    </template>
  </UIModal>
</template>

<script>
import UIModal from '@/components/ui/UIModal.vue'
import UIFlex from '@/components/ui/UIFlex.vue'
import UIButton from '@/components/ui/UIButton.vue'
import UIIcon from '@/components/ui/UIIcon.vue'
import UIList from '@/components/ui/UIList.vue'
import {acceptIcon} from '@/components/ui/icons'

export default {
  components:{UIModal,UIFlex,UIButton,UIIcon,UIList},
  emits:['onClose','onSelect'],
  props:['structures','modelValue'],
  data(){
    return{
      acceptIcon,
      selectedItem:null
    }
  },
  methods:{
    select(){
      this.$emit("update:modelValue", this.selectedItem);
      this.$emit("onSelect", this.selectedItem);
    }
  }
}
</script>

<style lang="scss" scoped>
  .building-picker{
    width:400px;
    height:400px;
  }
  p{
    max-width:600px;
    margin:0px;
    padding:0px;
  }
  .ui-image{
    width:25%;
    height:150px;
    object-fit: cover;
    object-position: center;
  }
  .selected{
    background-color:$ui-control-background-primary;
  }
  
</style>