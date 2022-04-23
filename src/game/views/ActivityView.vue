<template>
  <div class="activity-view" >
      <div v-for="(d,index) in draggables" :key="index" class="draggable" :class="{selected:d.selected}" draggable="true" @dragleave="dragLeave($event,d)" @dragenter="dragEnter($event,d)">{{d.label}}</div>
  </div>
  <div class="dst">
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
interface Draggable{
    id:number;
    label:string;
    selected?:boolean;
}
export default defineComponent({
    setup() {
        const draggables = ref<Draggable[]>([
            {id:1,label:'fu'},
            {id:2,label:'bar'},
            {id:3,label:'baz'},
        ])
        const dragStart = (e:Event)=>{
            console.log(e);
        }

        const dragOver = (e:Event) => {
            console.log(e.target);
        }

        const dragEnter = (e:Event,i:Draggable) => {
            draggables.value.forEach( draggable => {
                if(draggable.id == i.id){
                    draggable.selected = true;
                }else{
                    draggable.selected = false;
                }
            });
        }

        const dragLeave = (e:Event,i:Draggable) => {
            console.log(i);
        }

      return {draggables,dragLeave,dragEnter}
    },
})
</script>


<style lang="scss" scoped>
    .activity-view{
        margin-top:105px;
    }
    .draggable{
        border:1px solid black;
    }
    .selected{
        border-bottom:3px solid black;
    }
</style>