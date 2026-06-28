<script setup lang="ts">
import HomeLayout from '@/components/layout/HomeLayout.vue'
import {type ComponentInternalInstance, getCurrentInstance, h, nextTick, provide} from "vue";
import {MESSAGE_GROUP, SOCKET_EVENT_TYPE} from "@/constants/messageConstant.ts";
import {parseSocketRestPayload} from "@/types/socket.ts";
import type {
  MessageGroup,
  RestResult,
  UserChatConversationEntity,
  UserChatConversationResponseBody,
  UserChatMessageResponseBody
} from "@/types/apis";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import useApp from "antdv-next/dist/app/useApp";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.ts";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {
  createAvatarNode,
  getEnumValue,
  getMessageContent,
  requireNonNullOrUndefined
} from "@/utils";
import {Typography} from 'antdv-next'
import {useSocketSubscriptions} from "@/composables";
import {AuthServerService} from "@/apis";
import {HOME_NOTIFICATION_CACHE_PROVIDE_KEY} from "@/constants/systemConstant.ts";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";

defineOptions({
  name: 'IndexHome',
})

provide(HOME_NOTIFICATION_CACHE_PROVIDE_KEY, getNotificationKey)

const principalStore = usePrincipalStore();
const messageServerStore = useMessageServerStore();
const configProviderStore = useConfigProviderStore();
const { notification } = useApp();
const getNotificationKeyCache:Record<string, unknown> = {}

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const {on} = useSocketSubscriptions()

function getNotificationKey(type:MessageGroup) {
  if (type === MESSAGE_GROUP.USER_CHAT) {
    return new Set((getNotificationKeyCache[type] as Set<string>) || [])
  }
  return null;
}

function setNotificationKeys(type:MessageGroup, keys:Set<string>) {
  getNotificationKeyCache[type] = keys
}

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

async function onChatMessageReceived(
  result: RestResult<UserChatMessageResponseBody>,
  event:string
) {
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
  let notificationKey = MESSAGE_GROUP.USER_CHAT + "_" + body.id;
  let description:string = getMessageContent(result.data, body)
  let duration = configProviderStore.state.notificationConfig.duration;
  let messageId = undefined
  if (event === SOCKET_EVENT_TYPE.CHAT_MESSAGE && getEnumValue(body.muted) === 0) {
    description = getMessageContent(result.data, body)
  } else if (event === SOCKET_EVENT_TYPE.CHAT_MESSAGE_MENTION) {
    const message = result.data

    notification.destroy(notificationKey)
    notificationKey = MESSAGE_GROUP.USER_CHAT + "_" + SOCKET_EVENT_TYPE.CHAT_MESSAGE_MENTION + "_" + message.id;

    duration = false
    messageId = message.id

    description = globalProperties.$t(
      'chat.notification.mention',
      {principal:'[' + AuthServerService.getPrincipalNameByUserDetails(message.participant.metadata.details) + '] '}
    )
  }

  if (description === '') {
    return
  }

  const keys:Set<string> = getNotificationKey(MESSAGE_GROUP.USER_CHAT) || new Set()
  if (keys.has(notificationKey)) {
    notification.destroy(notificationKey)
    await nextTick()
  }
  notification.info({
    key:notificationKey,
    title: body.name,
    duration:duration,
    description:createNotificationDescription(description),
    icon: createAvatarNode(body.cover, body.name,'large', '[&>*:not(:first-child)]:-ms-8!'),
    classes:{
      root: 'cursor-pointer',
      icon: 'leading-normal! text-inherit flex items-center',
      title: 'font-medium'
    },
    onClick:() => globalProperties.$router.push({name:'my_chat_message', query:{conversationId:body.id, messageId}})
  })
  keys.add(notificationKey)
  setNotificationKeys(MESSAGE_GROUP.USER_CHAT, keys)

}

on(
  SOCKET_EVENT_TYPE.CHAT_MESSAGE,
  (payload) => onChatMessageReceived(parseSocketRestPayload<UserChatMessageResponseBody>(payload), SOCKET_EVENT_TYPE.CHAT_MESSAGE)
)

on(
  SOCKET_EVENT_TYPE.CHAT_MESSAGE_MENTION,
  (payload) => onChatMessageReceived(parseSocketRestPayload<UserChatMessageResponseBody>(payload), SOCKET_EVENT_TYPE.CHAT_MESSAGE_MENTION)
)
on(
  SOCKET_EVENT_TYPE.CHAT_MESSAGE_UNDO,
  () => messageServerStore.fetchUnreadQuantity()
)
</script>

<template>
  <div>
    <home-layout/>
  </div>
</template>
