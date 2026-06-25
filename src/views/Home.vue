<script setup lang="ts">
import HomeLayout from '@/components/layout/HomeLayout.vue'
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  h,
  onMounted,
  onUnmounted,
  ref
} from "vue";
import {SOCKET_EVENT_TYPE} from "@/constants/messageConstant.ts";
import {parseSocketRestPayload} from "@/types/socket.ts";
import type {
  RestResult,
  UserChatConversationEntity,
  UserChatConversationResponseBody,
  UserChatMessageResponseBody
} from "@/types/apis";
import {useSocketStore} from "@/stores/socketStore.ts";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import useApp from "antdv-next/dist/app/useApp";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.ts";
import {getMessageContent} from "@/composables/chat/chatContentFormat.ts";
import {createAvatarNode} from "@/composables/chat/chatAvatar.ts";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {Typography} from 'antdv-next'

defineOptions({
  name: 'IndexHome',
})

const socketListener = ref<((() => void) | undefined)[]>([])
const socketStore = useSocketStore();
const principalStore = usePrincipalStore();
const messageServerStore = useMessageServerStore();
const { notification } = useApp();

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

function createNotificationDescription(text: string) {
  if (!text) {
    return ''
  }
  return h(
    Typography.Paragraph,
    {
      class: 'm-0! text-text-secondary',
      ellipsis: {rows: 2},
    },
    () => text,
  )
}

async function onChatMessageReceived(result: RestResult<UserChatMessageResponseBody>) {
  if (!result.data || result.data.principal === principalStore.state.name) {
    return
  }

  await messageServerStore.fetchUnreadQuantity()
  if (globalProperties.$route.name === 'my_chat_message') {
    return
  }

  const conversationResult:RestResult<UserChatConversationEntity | UserChatConversationResponseBody> = await ChatMessageService.getConversation(result.data.chatRoomId, true)
  if (!conversationResult.data) {
    return ;
  }
  const body:UserChatConversationResponseBody = conversationResult.data as UserChatConversationResponseBody;
  if (getEnumValue(body.muted) === 1) {
    return
  }

  notification.info({
    title: body.name,
    description:createNotificationDescription(getMessageContent(result.data)),
    icon: createAvatarNode(body.cover, body.name,'large', '[&>*:not(:first-child)]:-ms-8!'),
    classes:{
      root: 'cursor-pointer',
      icon: 'leading-normal! text-inherit flex items-center',
      title: 'font-medium'
    },
    onClick:() => globalProperties.$router.push({name:'my_chat_message', query:{conversationId:body.id}})
  })
}

function mounted(){
  socketListener.value.push(socketStore.subscribe(
    SOCKET_EVENT_TYPE.CHAT_MESSAGE,
    (payload) => onChatMessageReceived(parseSocketRestPayload<UserChatMessageResponseBody>(payload))
  ))
}

onMounted(mounted)
onUnmounted(() => socketListener.value.forEach(s => s?.()))
</script>

<template>
  <div>
    <home-layout/>
  </div>
</template>
