<template>
    <UIFlex direction="row" justifyContent="flex-start"  alignItems="center" gap="10">
        <UIIcon :src="item.media.icon.url" size="medium"/>
        <UILabel>{{amount}} {{item.media.name}}</UILabel>
    </UIFlex>
</template>

<script>
import { fmtResourceAmount } from 'server/functions';
import UIFlex from '../ui/UIFlex.vue'
import UIIcon from '../ui/UIIcon.vue'
import UILabel from '../ui/UILabel.vue'
export default {
    props:["item"], // WithAmount<Resource> o WithMedia<ResourceAmount> o cualquier cosa con media & amount;
    components:{UIFlex,UIIcon,UILabel},
    computed:{
        amount(){
            return fmtResourceAmount(this.item.amount);
        }
    }
}
</script>

<style>

</style>