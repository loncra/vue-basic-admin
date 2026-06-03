<script setup lang="ts">
import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import LMySiteMessage from "@/components/my/MySiteMessage.vue";
import LMyChatMessage from "@/components/my/MyChatMessage.vue";
import {markRaw, ref} from "vue";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";

defineOptions({
  name: 'CommonMyMessage',
})

const messageServerStore = useMessageServerStore()
const segmented = ref<{
  value:string
  data:Record<string, unknown>[]
}>({
  value:'site_message',
  data:[{
    value:'site_message',
    text:'站内消息',
    iconFont:'loncra-message-square-text',
    component:markRaw(LMySiteMessage)
  },{
    value:'chat_message',
    text:'我的聊天',
    iconFont:'loncra-messages-square',
    component: markRaw(LMyChatMessage)
  },{
    value:'ai_chat',
    text:'ai',
    iconFont:'loncra-bot'
  }]
})

function onSegmented(value:string) {
  segmented.value.value = value;
}
</script>

<template>
  <a-flex flex="1" >
    <l-menu-title-card
      :classes="{
        root:'min-h-0 flex flex-col size-full shadow-ter',
        header: 'flex-shrink-0',
        body:'flex-1 min-h-100 p-0 overflow-hidden'
      }"
    >
      <template #extra>
        <template v-if="segmented.value === 'site_message'">
          {{segmented.data.find(v => v.value === 'site_message')?.text}}
        </template>
      </template>
      <a-flex align="start" flex="1" class="h-full">
        <div class="h-full p-xs bg-layout border-t border-t-border-secondary">
          <a-segmented size="large" orientation="vertical" v-model:value="segmented.value" block :options="segmented.data" @change="onSegmented">
            <template #iconRender="{ iconFont, text, value }">
              <a-tooltip :title="text" placement="left">
                <a-badge dot :count="messageServerStore.getUnreadQuantityByType(value)">
                  <icon-font class="icon align" :type="iconFont" />
                </a-badge>
              </a-tooltip>
            </template>
          </a-segmented>
        </div>
        <a-flex flex="1" class="h-full">
          <component :is="segmented.data.find(v => v.value === segmented.value)?.component" />
        </a-flex>
      </a-flex>

    </l-menu-title-card>
  </a-flex>
</template>
