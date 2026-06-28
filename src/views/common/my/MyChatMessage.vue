<script setup lang="ts">
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  inject,
  nextTick,
  onMounted,
  type Ref,
  ref
} from "vue";
import {
  type ContactItem,
  type IdNameValueMetadata,
  type MessageGroup,
  type PlatformUser,
  type RestResult,
  type UserChatConversationResponseBody,
  type UserChatMessageResponseBody
} from "@/types/apis";
import {requireNonNullOrUndefined} from "@/utils";
import {AuthServerService} from "@/apis";
import {usePrincipalStore} from "@/stores/principalStore";
import LChatConversation from "@/components/chat/ChatConversation.vue";
import LChatContact from "@/components/chat/ChatContact.vue";
import LChatView from "@/components/chat/ChatView.vue";
import type {ServerConversationItem} from "@/types/composables";
import LChatRoomView from "@/components/chat/ChatRoomView.vue";
import {type ChatViewController, provideChatContext} from "@/composables/chat";
import {HOME_NOTIFICATION_CACHE_PROVIDE_KEY} from "@/constants/systemConstant.ts";
import {MESSAGE_GROUP} from "@/constants/messageConstant.ts";
import useApp from "antdv-next/dist/app/useApp";

defineOptions({
  name: 'MyChatMessageHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()

const { notification } = useApp();

const segmented = ref<{
  value: string
  data: Record<string, unknown>[]
}>({
  value: 'conversation',
  data: [{
    value: 'conversation',
    iconText: 'loncra-message-square-more'
  }, {
    value: 'contact',
    iconText: 'loncra-contact'
  }]
})

const options = ref<{
  contactDataSource: ContactItem[]
  loading: boolean
}>({
  contactDataSource: [],
  loading: false
})

const getNotificationCache = inject<(type: MessageGroup) => unknown | null>(HOME_NOTIFICATION_CACHE_PROVIDE_KEY)

const chatViewRef = ref<ChatViewController>()
const conversationRef = ref<InstanceType<typeof LChatConversation>>()

const {conversationActive, conversations, loader, activateConversation, refreshConversations} =
  provideChatContext({
    view: chatViewRef as Ref<ChatViewController | undefined>,
    refreshActiveHeader: (item: ServerConversationItem | undefined) =>
      conversationRef.value?.changeMessageExtraContent(item),
  })

async function onContactSelected(value: UserChatConversationResponseBody) {
  const target = conversations.upsertToTop(value)
  segmented.value.value = 'conversation'
  await activateConversation(target)
}

function onConversationDelete(body: UserChatConversationResponseBody) {
  conversations.remove(body.id)
  if (conversationActive.value.item?.data?.id === body.id) {
    activateConversation(undefined)
  }
}

async function onAddParticipant(
  _user: ContactItem[],
  restResult: RestResult<UserChatConversationResponseBody>,
) {
  if (!restResult.data) {
    return
  }
  await activateConversation(restResult.data)
}

function onHistoryClick(data: UserChatMessageResponseBody) {
  loader.jumpToHistoryMessage(data)
}

async function mounted() {
  const keys:unknown | null = getNotificationCache?.(MESSAGE_GROUP.USER_CHAT)
  if (keys) {
    const messageNotificationKeys = keys as Set<string>
    messageNotificationKeys.forEach((key) => notification.destroy(key))
  }
  options.value.loading = true
  try {
    await refreshConversations()
    const contactResult: RestResult<IdNameValueMetadata<PlatformUser[]>[]> =
      await AuthServerService.systemUsers({number: -1}, true, false)
    if (contactResult.data) {
      const list: ContactItem[] = []
      for (const r of contactResult.data) {
        r.value.forEach((v) =>
          list.push({
            key: String(v.id),
            label: v.realName || v.username,
            group: r.name,
            disabled: principalStore.isCurrentPrincipal(v.systemName),
            data: v,
          }),
        )
      }
      options.value.contactDataSource = [...list]
    }
  } finally {
    options.value.loading = false
  }
  await nextTick()
  const find = conversations.findById(Number(globalProperties.$route.query.conversationId))
  if (find) {
    await activateConversation(find, Number(globalProperties.$route.query.messageId))
  }
}

onMounted(mounted)
</script>

<template>
  <div class="h-full min-h-0">
    <a-splitter class="h-full min-h-0">
      <a-splitter-panel class="h-full p-0 overflow-hiddenl" default-size="20%" min="15%" max="25%">
        <a-spin :spinning="options.loading" class="size-full-spin">
          <a-flex vertical class="size-full min-h-0">
            <l-chat-conversation
              ref="conversationRef"
              @delete="onConversationDelete"
              v-if="segmented.value === 'conversation'"
            />
            <l-chat-contact
              @selected="onContactSelected"
              v-model:loading="options.loading"
              v-else-if="segmented.value === 'contact'"
              v-model:data-source="options.contactDataSource"
            />
            <div class="shrink-0 p-xs bg-layout -ml-1px">
              <a-segmented v-model:value="segmented.value" block :options="segmented.data"
                           @change="(key:string )=> segmented.value = key ">
                <template #iconRender="{ iconText }">
                  <icon-font class="icon align" :type="iconText"/>
                </template>
              </a-segmented>
            </div>
          </a-flex>
        </a-spin>
      </a-splitter-panel>
      <a-splitter-panel class="h-full min-h-0 overflow-hidden">
        <div class="h-full min-h-0 overflow-hidden relative" v-if="conversationActive.item">
          <a-spin :spinning="conversationActive.loading" class="size-full-spin">
            <l-chat-view ref="chatViewRef">
              <template #bubbleListAfter>
                <a-button
                  @click="loader.toReadableAnchor()"
                  v-if="loader.showReadableAnchorButton()"
                  class="shadow-card absolute top-2 mt-sm left-1/2 -translate-x-1/2 animate-bounce"
                >
                  <template #icon>
                    <icon-font type="loncra-hard-drive-upload"/>
                  </template>
                  <span>{{globalProperties.$t('chat.view.readable.jumpTo')}}</span>
                </a-button>
              </template>
            </l-chat-view>
          </a-spin>
          <a-drawer
            v-if="conversationActive.item.data"
            v-model:open="conversationActive.drawerOpen"
            placement="right"
            :get-container="false"
            :closable="false"
            :mask="false"
            @close="conversationActive.drawerOpen = false"
          >
            <l-chat-room-view
              @delete-conversation="onConversationDelete"
              @add-participant="onAddParticipant"
              @history-click="onHistoryClick"
              :contact-data-source="options.contactDataSource" />
          </a-drawer>
        </div>
        <a-flex v-else vertical class="size-full" justify="center" align="center">
          <a-empty/>
        </a-flex>
      </a-splitter-panel>
    </a-splitter>
  </div>
</template>
