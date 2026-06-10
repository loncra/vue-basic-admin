<script setup lang="ts">
import HomeLayout from '@/components/layout/HomeLayout.vue'
import {type ComponentInternalInstance, getCurrentInstance, onMounted, onUnmounted, ref} from "vue";
import {SOCKET_EVENT_TYPE} from "@/constants/messageConstant.ts";
import {parseSocketRestPayload} from "@/types/socket.ts";
import type {
  RestResult,
  UserChatConversationEntity,
  UserChatMessageResponseBody
} from "@/types/apis";
import {useSocketStore} from "@/stores/socketStore.ts";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import useApp from "antdv-next/dist/app/useApp";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.ts";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {getEnumValue, requireNonNullOrUndefined} from "@/utils";
import { Typography } from 'antdv-next'
import { h } from 'vue'
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

  if (globalProperties.$route.name === 'my_chat_message') {
    return
  }

  await messageServerStore.fetchUnreadQuantity()
  const conversationResult:RestResult<UserChatConversationEntity> = await ChatMessageService.getConversation(result.data.chatRoomId)
  if (!conversationResult.data || getEnumValue(conversationResult.data.muted) === 1) {
    return
  }

  notification.info({
    title: conversationResult.data.name,
    description:createNotificationDescription(ChatMessageService.getMessageContent(result.data)),
    icon: ChatMessageService.createAvatarNode(conversationResult.data.cover, conversationResult.data.name,'large', '[&>*:not(:first-child)]:-ms-8!'),
    classes:{
      root: 'cursor-pointer',
      icon: 'leading-normal! text-inherit flex items-center',
      title: 'font-medium'
    },
    onClick:() => globalProperties.$router.push({name:'my_chat_message', query:{conversationId:conversationResult.data?.id}})
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
