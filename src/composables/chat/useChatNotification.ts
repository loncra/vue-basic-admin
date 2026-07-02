import {useSocketSubscriptions} from "@/composables";
import {MESSAGE_GROUP, SOCKET_EVENT_TYPE} from "@/constants/messageConstant.ts";
import {parseSocketRestPayload} from "@/types/socket.ts";
import type {
  RestResult,
  UserChatConversationEntity, UserChatConversationResponseBody,
  UserChatMessageResponseBody
} from "@/types/apis";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.ts";
import {
  createAvatarNode,
  getEnumValue,
  getMessageContent,
  requireNonNullOrUndefined
} from "@/utils";
import {AuthServerService} from "@/apis";
import {type ComponentInternalInstance, getCurrentInstance} from "vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {useAppNotification} from "@/composables/useAppNotification.ts";


export function useChatNotification() {
  const {on} = useSocketSubscriptions()
  const {destroy, info, createNotificationDescription} = useAppNotification()
  const messageServerStore = useMessageServerStore()
  const principalStore = usePrincipalStore()
  const configProviderStore = useConfigProviderStore()
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

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

    const conversationResult:RestResult<UserChatConversationEntity | UserChatConversationResponseBody> = await ChatMessageService.getConversation(result.data.userChatRoomId, true)
    if (!conversationResult.data) {
      return ;
    }

    const body:UserChatConversationResponseBody = conversationResult.data as UserChatConversationResponseBody;
    let notificationKey = MESSAGE_GROUP.USER_CHAT + "_" + body.id;
    let description:string = getMessageContent(result.data, body)
    let duration = configProviderStore.state.notificationConfig.duration;
    let messageId = undefined
    if (event === SOCKET_EVENT_TYPE.CHAT_MESSAGE && getEnumValue(body.muted) !== 0) {
      return
    } else if (event === SOCKET_EVENT_TYPE.CHAT_MESSAGE_MENTION) {
      const message = result.data

      destroy(notificationKey)
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

    await info({
        title: body.name,
        duration:duration,
        description:createNotificationDescription(description),
        icon: createAvatarNode(body.cover, body.name,'large', '[&>*:not(:first-child)]:-ms-8!'),
        onClick:() => globalProperties.$router.push({name:'my_chat_message', query:{conversationId:body.id, messageId}})
      },
      MESSAGE_GROUP.USER_CHAT,
      notificationKey
    )

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
}
