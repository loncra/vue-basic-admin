<script setup lang="ts">

import {AttachmentService} from "@/apis";
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  h,
  inject,
  ref,
  resolveComponent,
  type VNode
} from "vue";
import type {UserChatConversationResponseBody} from "@/types/apis";
import type {ConversationItemType, ItemType} from "@antdv-next/x/dist/conversations/interface";
import {
  createAvatarNode,
  createIcon,
  getDraftContent,
  getEnumValue, getMessageContent,
  requireNonNullOrUndefined
} from "@/utils";
import {Conversations as AxConversations,} from '@antdv-next/x'
import type {ServerConversationItem} from "@/types/composables";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import {MESSAGE_GROUP, MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY} from "@/constants/messageConstant.ts";
import type {MenuItemType} from "antdv-next";
import useApp from "antdv-next/dist/app/useApp";
import {
  useChatContext,
  useConversationActions
} from "@/composables/chat";

defineOptions({
  name: 'LChatConversation',
})

const {modal} = useApp()

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const setMessageExtraContent = inject<((node: VNode) => void) | undefined>(MY_MESSAGE_EXTRA_CONTENT_PROVIDE_KEY)

const messageServerStore = useMessageServerStore()
const {conversations, conversationActive, loader} = useChatContext()
const conversationActions = useConversationActions()

const moreButtonActive = ref(false)
const searchValue = ref<string>('')

const activeKey = computed(() => conversationActive.value.item?.key)

const emit = defineEmits<{
  delete: [item:UserChatConversationResponseBody]
}>()

const DEFAULT_MENU_ITEMS = computed((): MenuItemType[] => [
  {
    type: "divider",
  },
  {
    label: globalProperties.$t("common.delete.text"),
    key: 'delete',
    icon:createIcon('loncra-archive-x', 'text-lg'),
    danger: true,
  },
])

function createMenu(item:UserChatConversationResponseBody):MenuItemType[] {
  const temp = [...DEFAULT_MENU_ITEMS.value]
  if (getEnumValue(item.muted) === 0) {
    temp.unshift({
      label: globalProperties.$t("chat.muted.action"),
      key: 'muted',
      icon:createIcon('loncra-megaphone-off', 'text-lg'),
    })
  } else {
    temp.unshift({
      label: globalProperties.$t("chat.muted.cancel"),
      key: 'muted',
      icon:createIcon('loncra-megaphone', 'text-lg'),
    })
  }
  if (getEnumValue(item.pinned) === 0) {
    temp.unshift({
      label: globalProperties.$t("chat.pinned.action"),
      key: 'pinned',
      icon:createIcon('loncra-heart', 'text-lg'),
    })
  } else {
    temp.unshift({
      label: globalProperties.$t("chat.pinned.cancel"),
      key: 'pinned',
      icon:createIcon('loncra-heart-off', 'text-lg'),
    })
  }
  return temp;
}

function onMoreClick(item: ServerConversationItem) {
  if (!item.data) {
    return
  }
  moreButtonActive.value = !moreButtonActive.value
  conversationActive.value.drawerOpen = !conversationActive.value.drawerOpen
}

function createMoreButton(activeConversationItem:ServerConversationItem) {
  return h(
    resolveComponent('AButton'),
    {
      type:'text',
      icon: () => createIcon(moreButtonActive.value ? 'loncra-panel-right-close' : 'loncra-panel-left-close'),
      size: 'small',
      onClick: () => onMoreClick(activeConversationItem),
    },
  )
}

function onConversationsActiveChange(value: string, item: ItemType | undefined): void {
  if (!item || !(item as ConversationItemType)) {
    return;
  }
  const conversationItem = item as ConversationItemType
  const activeConversationItem:ServerConversationItem = {
    key: value,
    label: typeof conversationItem.label === 'string' ? conversationItem.label : String(conversationItem.label ?? ''),
    data: conversationItem.data as UserChatConversationResponseBody,
  }
  changeMessageExtraContent(activeConversationItem)
  loader.switchConversation(activeConversationItem)
}

function changeMessageExtraContent(activeConversationItem:ServerConversationItem | undefined) {
  if (!activeConversationItem) {
    setMessageExtraContent?.(h('span'))
    return null
  }
  const label = h('span', {}, {default: () => activeConversationItem.label})
  const space = resolveComponent('ASpace')
  const avatar = createAvatarNode(activeConversationItem.data?.cover || [], String(activeConversationItem.label))
  const button = createMoreButton(activeConversationItem)
  const node: VNode = h(
    space,
    {},
    { default: () => [label, avatar, button] }
  )

  setMessageExtraContent?.(node)
}

async function onMenuClick(e: { key: string}, item:UserChatConversationResponseBody) {
  if (e.key === 'delete') {
    modal.confirm({
      title: globalProperties.$t('common.delete.confirmTitle'),
      content:globalProperties.$t('common.delete.confirmSingle'),
      onOk: () => doDelete(item),
    })
  } else if (e.key === 'pinned') {
    const data = await conversationActions.togglePinned([Number(item.id)])
    conversations.patchFlags(data)
  } else if (e.key === 'muted') {
    const data = await conversationActions.toggleMuted([Number(item.id)])
    conversations.patchFlags(data)
  }
}

async function doDelete(item: UserChatConversationResponseBody) {
  const success = await conversationActions.removeConversations([Number(item.id)])
  if (success) {
    emit("delete", item)
  }
}

const conversationCount = computed(() => conversations.dataSource.value.length)

const conversationItems = computed(() =>
  conversations.sortedDataSource.value
    .filter(s => searchValue.value === '' ? s : s.name.includes(searchValue.value))
    .map(r => ({
      label: r.name,
      key: String(r.id),
      data: r
    })),
)

defineExpose({
  changeMessageExtraContent
})

</script>

<template>
  <a-flex vertical class="h-full min-h-0 overflow-hidden" >
    <div class="shrink-0 p-sm">
      <a-input v-model:value="searchValue">
        <template #suffix>
          <icon-font class="text-text-quaternary" type="loncra-user-search"/>
        </template>
      </a-input>
    </div>
    <ax-conversations
      :activeKey="activeKey"
      :classes="{item:'p-xs! h-auto! min-h-auto! rounded-none!'}"
      :items="conversationItems"
      :onActiveChange="onConversationsActiveChange"
      v-if="conversationCount > 0"
      class="min-h-0 size-full flex-[1_1_0] p-0! gap-0!">
      <template #iconRender="{ item }">
        <a-flex justify="center" align="center" :class="'h-full relative ' + (getEnumValue(item.data.muted) === 1 ? 'opacity-80' : '')">
          <a-badge size="small" :count="getEnumValue(item.data.muted) === 1 ? 0 : messageServerStore.getUnreadQuantity(MESSAGE_GROUP.USER_CHAT, item.key)" >
            <a-avatar-group :max="{count: 3}" v-if="(item.data.cover || []).length > 0" size="large" class="[&>*:not(:first-child)]:-ms-8!">
              <a-avatar v-for="c in item.data.cover" :key="c.objectName" :src="AttachmentService.query(c.bucketName, c.objectName)" />
            </a-avatar-group>
            <a-avatar v-else size="large">
              {{ item?.label.substring(0,1) }}
            </a-avatar>
          </a-badge>
          <div v-if="getEnumValue(item.data.pinned) === 1" class="inline-block absolute top-0 left-0 pl-xxs pr-xxs opacity-80 border border-solid border-warning-border bg-warning rounded-full">
            <icon-font class="text-md text-white" type="loncra-heart" />
          </div>
          <div v-if="getEnumValue(item.data.muted) === 1" class="inline-block absolute bottom-0 left-0 pl-xxs pr-xxs border border-dashed opacity-80 bg-elevated rounded-full">
            <icon-font class="text-md text-error" type="loncra-megaphone-off" />
          </div>
        </a-flex>
      </template>
      <template #labelRender="{item}">
        <a-dropdown :menu="{ items:createMenu(item.data) }" :trigger="['contextmenu']" @menuClick="onMenuClick($event, item.data)">
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
            <a-typography-text ellipsis v-if="item?.data?.draft && item?.data?.draft.length > 0" type="danger">
              [{{globalProperties.$t('chat.conversation.draft')}}]:{{ getDraftContent(item?.data?.draft) }}
            </a-typography-text>
            <a-typography-text ellipsis v-else-if="item?.data?.lastUserMessage" type="secondary">
              {{ getMessageContent(item?.data?.lastUserMessage) }}
            </a-typography-text>
          </a-flex>
        </a-dropdown>
      </template>
    </ax-conversations>
    <a-flex v-else justify="center" align="center" class="size-full">
      <a-empty/>
    </a-flex>
  </a-flex>
</template>
