<script setup lang="ts">
import {
  Conversations as AxConversations,
  Bubble as AxBubble,
  Sender as AxSender,
  SenderHeader as AxSenderHeader,
} from '@antdv-next/x'
import {h, inject, onMounted, ref, type VNode} from "vue";
import type {
  ItemType
} from "@antdv-next/x/dist/conversations/interface";
import LAttachmentUpload from "@/components/attachment/AttachmentUpload.vue";
import { MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY } from "@/constants/systemConstant";

const setMessageExtraContent = inject<((node: VNode) => void) | undefined>(MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY)
defineOptions({
  name: 'MyChatMessageHome',
})

const dataSource = ref<ItemType[]>([{
  key:'1',
  label:'sdfasdfsdfasdfsdfasdfsdfasdfsdfasdf',
  data:{
    lastMessage:'asdfasdfadfsdfsdfasdfsdfasdfsdfasdfsdfasdfsdfasdfsdfasdf'
  }
},{
  key:'2',
  label:'sdfasdfsdfasdfsdfasdfsdfasdfsdfasdf',
  data:{
    lastMessage:'asdfasdfadfsdfsdfasdfsdfasdfsdfasdfsdfasdfsdfasdfsdfasdf'
  }
},{
  key:'3',
  label:'sdfasdfsdfasdfsdfasdfsdfasdfsdfasdf',
  data:{
    lastMessage:'asdfasdfadfsdfsdfasdfsdfasdfsdfasdfsdfasdfsdfasdfsdfasdf'
  }
}])

const conversationActive = ref<{
  key?:string,
  item?:ItemType | undefined
  loading:boolean,
  sending?:boolean
  openHeader?:boolean,
  text?:string
}>({
  key:undefined,
  loading:false,
  sending:false,
  openHeader:false
})

function onConversationsActiveChange(value: string, item: ItemType | undefined): void {
  conversationActive.value.key = value
  if (item) {
    conversationActive.value.item = item
  }
}

</script>

<template>
  <div class="size-full">
  <a-splitter class="h-full min-h-0">
    <a-splitter-panel class="h-ful min-h-0 overflow-hiddenl" default-size="20%" min="15%" max="25%">
      <a-flex vertical class="h-full min-h-0">
        <div class="shrink-0 p-md">
          <a-input-search />
        </div>
        <a-flex flex="1" class="h-full min-h-0">
          <ax-conversations
            :activeKey="conversationActive.key"
            :classes="{item:'p-xs'}"
            :items="dataSource"
            :onActiveChange="onConversationsActiveChange"
            v-if="dataSource.length > 0"
            class="w-full">
           <template #iconRender="{ item }" >
              <a-avatar
                :src="item?.data?.avatar"
                size="large"
              >
                {{item.label.substring(0,1)}}
              </a-avatar>
            </template>
            <template #labelRender="{item}">
                <a-flex vertical>
                  <a-flex gap="small">
                    <a-typography-text ellipsis class="flex-1">
                      {{item?.label}}
                    </a-typography-text>
                    <a-typography-text type="secondary" >
                      14:00
                    </a-typography-text>
                  </a-flex>
                  <a-typography-text ellipsis type="secondary">
                    {{item?.data?.lastMessage}}
                  </a-typography-text>
                </a-flex>
            </template>
          </ax-conversations >
          <a-flex v-else justify="center" align="center" class="h-full">
            <a-empty />
          </a-flex>
        </a-flex>
        <a-space-compact block class="shrink-0 p-xs bg-layout">

          <a-button type="text" size="small" block>
            <icon-font class="icon" type="loncra-message-square-more"/>
          </a-button>
          <a-divider type="vertical" class="h-full" />
          <a-button type="text" size="small" block>
            <icon-font class="icon" type="loncra-contact"/>
          </a-button>
        </a-space-compact>
      </a-flex>
    </a-splitter-panel>
    <a-splitter-panel class="h-full min-h-0 overflow-hidden">
      <a-flex 
        vertical 
        v-if="conversationActive.key" 
        class="h-full min-h-0 flex-col overflow-hidden"
      >
        <a-flex flex="1" vertical class="overflow-y-auto min-h-0 p-md">
          <ax-bubble content="align left">
            <template #avatar>
              <a-avatar
                size="large"
              >
                s
              </a-avatar>
            </template>
          </ax-bubble>
          <ax-bubble content="align left" placement="end">
            <template #avatar>
              <a-avatar
                size="large"
              >
                a
              </a-avatar>
            </template>
          </ax-bubble>
          <ax-bubble content="align left">
            <template #avatar>
              <a-avatar
                size="large"
              >
                s
              </a-avatar>
            </template>
          </ax-bubble>
          <ax-bubble content="align left" placement="end">
            <template #avatar>
              <a-avatar
                size="large"
              >
                a
              </a-avatar>
            </template>
          </ax-bubble><ax-bubble content="align left">
            <template #avatar>
              <a-avatar
                size="large"
              >
                s
              </a-avatar>
            </template>
          </ax-bubble>
          <ax-bubble content="align left" placement="end">
            <template #avatar>
              <a-avatar
                size="large"
              >
                a
              </a-avatar>
            </template>
          </ax-bubble><ax-bubble content="align left">
            <template #avatar>
              <a-avatar
                size="large"
              >
                s
              </a-avatar>
            </template>
          </ax-bubble>
          <ax-bubble content="align left" placement="end">
            <template #avatar>
              <a-avatar
                size="large"
              >
                a
              </a-avatar>
            </template>
          </ax-bubble><ax-bubble content="align left">
            <template #avatar>
              <a-avatar
                size="large"
              >
                s
              </a-avatar>
            </template>
          </ax-bubble>
          <ax-bubble content="align left" placement="end">
            <template #avatar>
              <a-avatar
                size="large"
              >
                a
              </a-avatar>
            </template>
          </ax-bubble><ax-bubble content="align left">
            <template #avatar>
              <a-avatar
                size="large"
              >
                s
              </a-avatar>
            </template>
          </ax-bubble>
          <ax-bubble content="align left" placement="end">
            <template #avatar>
              <a-avatar
                size="large"
              >
                a
              </a-avatar>
            </template>
          </ax-bubble><ax-bubble content="align left">
            <template #avatar>
              <a-avatar
                size="large"
              >
                s
              </a-avatar>
            </template>
          </ax-bubble>
          <ax-bubble content="align left" placement="end">
            <template #avatar>
              <a-avatar
                size="large"
              >
                a
              </a-avatar>
            </template>
          </ax-bubble>
        </a-flex>
        <div class="shrink-0 p-sm border-t border-t-border-secondary">
          <ax-sender
            v-model:value="conversationActive.text"
            placeholder="按 Enter 发送消息"
            :suffix="false"
            :auto-size="{ maxRows: 6 }"
          >
            <template #header>
              <ax-sender-header
                title="发送文件"
                :open="conversationActive.openHeader"
                :on-open-change="(val: boolean) => (conversationActive.openHeader = val)"
              >
                <l-attachment-upload />
              </ax-sender-header>
            </template>
            <template #footer="{ components }">
              <a-flex justify="space-between" align="center">
                <a-flex align="center" gap="small">
                  <a-button type="text" @click="conversationActive.openHeader = true">
                    <template #icon>
                      <icon-font class="text-md" type="loncra-upload"/>
                    </template>
                  </a-button>
                  <a-button type="text">
                    <template #icon>
                      <icon-font class="text-md" type="loncra-image-plus"/>
                    </template>
                  </a-button>
                </a-flex>
                <a-flex align="center" gap="small">
                  <a-button type="text">
                    <template #icon>
                      <icon-font class="text-md" type="loncra-smile"/>
                    </template>
                  </a-button>
                  <component :is="components.ClearButton" />
                  <component
                    :is="conversationActive.loading ? components.LoadingButton : components.SendButton"
                    type="primary"
                    :disabled="!conversationActive.text || conversationActive.sending"
                  >
                  </component>
                </a-flex>
              </a-flex>
            </template>
          </ax-sender>
        </div>
      </a-flex>
      <a-flex v-else vertical class="h-full" justify="center" align="center" >
        <a-empty />
      </a-flex>
    </a-splitter-panel>
  </a-splitter>
  </div>
</template>
