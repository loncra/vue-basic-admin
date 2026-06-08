<script setup lang="ts">

import {AttachmentService} from "@/apis";
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  h,
  inject,
  ref,
  resolveComponent,
  type VNode
} from "vue";
import type {
  FileObject,
  UserChatConversationResponseBody,
  UserChatMessageEntity
} from "@/types/apis";
import type {ConversationItemType, ItemType} from "@antdv-next/x/dist/conversations/interface";
import {MESSAGE_GROUP, MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY} from "@/constants/systemConstant.ts";
import {requireNonNullOrUndefined} from "@/utils";
import {Conversations as AxConversations,} from '@antdv-next/x'
import type {ServerConversationItem} from "@/types/composables";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";

defineOptions({
  name: 'LChatConversation',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const setMessageExtraContent = inject<((node: VNode) => void) | undefined>(MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY)

const messgeServerStore = useMessageServerStore()

const activeKey = ref<string>();
const dataSource = defineModel<UserChatConversationResponseBody[]>('dataSource', {default:() => []})

const emit = defineEmits<{
  change: [item: ServerConversationItem]
}>()

function onConversationsActiveChange(value: string, item: ItemType | undefined): void {
  activeKey.value = value
  if (!item || !(item as ConversationItemType)) {
    return;
  }
  const conversationItem = item as ConversationItemType
  const activeConversationItem:ServerConversationItem = {
    key: value,
    label: typeof conversationItem.label === 'string' ? conversationItem.label : String(conversationItem.label ?? ''),
    data: conversationItem.data as UserChatConversationResponseBody,
  }
  const label = h('span', {}, {default: () => activeConversationItem.label})
  const space = resolveComponent('ASpace')
  let avatar;
  const avatars:VNode[] = []
  for (const c of (activeConversationItem?.data?.cover || [])) {
    const a = h(
      resolveComponent('AAvatar'),
      {src: AttachmentService.query(c.bucketName, c.objectName)}
    )
    avatars.push(a)
  }
  if (avatars.length > 0) {
    avatar = h(
      resolveComponent('AAvatarGroup'),
      {
        max:{
          count:3
        }
      },
      avatars)
  } else {
    avatar = h(
      resolveComponent('AAvatar'),
      {},
      [String(activeConversationItem.label).substring(0, 1)]
    )
  }

  const node: VNode = h(
    space,
    {},
    [label, avatar]
  )

  setMessageExtraContent?.(node)

  emit("change", activeConversationItem)

}

function getLastMessageContent(lastUserMessage: UserChatMessageEntity | undefined) {
  if (!lastUserMessage) {
    return ''
  }
  let content = ""
  for (const block of lastUserMessage.content) {
    if (block.type === 'text') {
      content += block.value || ''
    } else if (block.type === 'custom' && block.slotKind === 'files') {
      for (const file of block.files) {
        const contentType = file?.extraHeaders?.['Content-Type'] || ''
        if (contentType.startsWith('image/')) {
          content += '[图片]'
        } else if (contentType.startsWith('video/')) {
          content += '[视频]'
        } else if (contentType.startsWith('audio/')) {
          content += '[音频]'
        } else {
          content += '[文件]'
        }
      }
    }
  }
  return content
}
</script>

<template>
  <a-flex flex="1" class="h-full min-h-0" >
    <ax-conversations
      :activeKey="activeKey"
      :classes="{item:'p-sm! h-auto! rounded-none!'}"
      :items="(dataSource || []).map(r => ({label:r.name, key:String(r.id), data:r}))"
      :onActiveChange="onConversationsActiveChange"
      v-if="dataSource.length > 0"
      class="w-full p-0! gap-0!">
      <template #iconRender="{ item }">
        <a-flex justify="center" align="center" class="h-full">
          <a-badge size="small" :count="messgeServerStore.getUnreadQuantity(MESSAGE_GROUP.USER_CHAT, item.key)" >
            <a-avatar-group :max="{count: 3}" v-if="(item.data.cover || []).length > 0">
              <a-avatar v-for="c in item.data.cover" :key="c.objectName" :src="AttachmentService.query(c.bucketName, c.objectName)" size="large"/>
            </a-avatar-group>
            <a-avatar v-else size="large">
              {{ item?.label.substring(0,1) }}
            </a-avatar>
          </a-badge>
        </a-flex>
      </template>
      <template #labelRender="{item}">
        <a-flex vertical>
          <a-flex gap="small">
            <a-typography-text ellipsis class="flex-1">
              {{ item?.label }}
            </a-typography-text>
            <a-typography-text type="secondary" v-if="item?.data?.lastUserMessage">
              {{
                globalProperties.$dayjs(item?.data?.lastUserMessage.creationTime).fromNow()
              }}
            </a-typography-text>
          </a-flex>
          <a-typography-text ellipsis v-if="item?.data?.draft" type="danger">
            [草稿]:{{ item?.data?.draft }}
          </a-typography-text>
          <a-typography-text ellipsis v-if="item?.data?.lastUserMessage" type="secondary">
            {{ getLastMessageContent(item?.data?.lastUserMessage) }}
          </a-typography-text>
        </a-flex>
      </template>
    </ax-conversations>
    <a-flex v-else justify="center" align="center" class="size-full">
      <a-empty/>
    </a-flex>
  </a-flex>
</template>
