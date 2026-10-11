import {useSocketSubscriptions} from '@/composables/useSocketSubscriptions.ts'
import {SOCKET_EVENT_TYPE, SYSTEM_ROUTE, YES_OR_NO_TYPE} from '@/constants';
import {parseSocketRestPayload} from "@/types/socket.ts";
import type {UserChatConversationResponseBody, UserChatMessageResponseBody} from "@/types/apis";
import type {IdValueMetadata, RestResult, TimeProperties} from "@loncra/client/commons";
import {getEnumName, isEnumValue} from "@loncra/client/commons"
import type {PlatformUser} from "@loncra/client/auth";
import type {UserChatCallEntity, UserChatCallParticipantEntity, UserChatCallResponseBody, UserChatConversationEntity} from "@loncra/client/message";
import {ChatMessageService, MESSAGE_SERVER_CHAT_CALL_TYPE, MESSAGE_SERVER_MESSAGE_GROUP} from "@loncra/client/message";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import {AuthServerService} from "@/apis";
import {
  createAvatarNode,
  createUserAvatarNode,
  getMessageContent,
  requireNonNullOrUndefined,
} from "@/utils";

import {type ComponentInternalInstance, getCurrentInstance, h, type Ref} from "vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {useAppNotification} from "@/composables/useAppNotification.ts";
import {Flex} from "antdv-next";
import {AudioOutlined, VideoCameraOutlined} from '@antdv-next/icons'
import {fillLocale} from '@loncra/antdv'
import {ImCallActions, provideImChatCall, useLocale} from '@loncra/antdv-chat-pro/im/call'


export function useChatNotification(config: {
  chatCallConfig: {closeTimerValue: Ref<TimeProperties>}
}) {
  const {on} = useSocketSubscriptions()
  const {destroy, info, createNotificationDescription} = useAppNotification()
  const messageServerStore = useMessageServerStore()
  const principalStore = usePrincipalStore()
  const configProviderStore = useConfigProviderStore()
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  const callLocale = useLocale('ImCall')
  const session = provideImChatCall({
    selfName: principalStore.state.name,
    principalName: (details) => details ? AuthServerService.getPrincipalNameByUserDetails(details) : '',
    closeTimeValue: config.chatCallConfig.closeTimerValue,
  })
  const acceptCall = session.accept.bind(session)
  const rejectCall = session.reject.bind(session)
  session.accept = async (callId) => {
    await acceptCall(callId)
    await messageServerStore.fetchUnreadQuantity()
  }
  session.reject = async (callId) => {
    await rejectCall(callId)
    await messageServerStore.fetchUnreadQuantity()
  }

  async function onChatMessageReceived(
    result: RestResult<UserChatMessageResponseBody>,
    event: string
  ) {
    if (!result.data || result.data.principal === principalStore.state.name) {
      return
    }

    await messageServerStore.fetchUnreadQuantity()

    const conversationResult: RestResult<UserChatConversationEntity | UserChatConversationResponseBody> = await ChatMessageService.getConversation(result.data.userChatRoomId, true)
    if (!conversationResult.data) {
      return;
    }

    const body: UserChatConversationResponseBody = conversationResult.data as UserChatConversationResponseBody;
    let notificationKey = MESSAGE_SERVER_MESSAGE_GROUP.USER_CHAT + "_" + body.id;
    let description: string = getMessageContent(result.data, body)
    let duration = configProviderStore.state.notificationConfig.duration;
    let messageId = undefined
    if (event === SOCKET_EVENT_TYPE.CHAT_MESSAGE && isEnumValue(body.muted, YES_OR_NO_TYPE.YES)) {
      return
    } else if (event === SOCKET_EVENT_TYPE.CHAT_MESSAGE_MENTION) {
      const message = result.data

      destroy(notificationKey)
      notificationKey = MESSAGE_SERVER_MESSAGE_GROUP.USER_CHAT + "_" + SOCKET_EVENT_TYPE.CHAT_MESSAGE_MENTION + "_" + message.id;

      duration = false
      messageId = message.id

      description = globalProperties.$t(
        'chat.notification.mention',
        {principal: '[' + AuthServerService.getPrincipalNameByUserDetails(message.participant.metadata.details) + '] '}
      )
    }

    if (description === '') {
      return
    }

    await info({
        title: body.name,
        duration: duration,
        description: createNotificationDescription(description),
        icon: createAvatarNode(
          Array.isArray(body.cover) ? body.cover : [],
          body.name || '',
          'large',
          '[&>*:not(:first-child)]:-ms-8!',
        ),
        classes: {
          root: 'cursor-pointer',
        },
        onClick: () => {
          void globalProperties.$router.push({
            name: SYSTEM_ROUTE.MY_CHAT_MESSAGE,
            query: {conversationId: body.id, messageId},
          }).then(() => {
            destroy(notificationKey)
          })
        },
      },
      MESSAGE_SERVER_MESSAGE_GROUP.USER_CHAT,
      notificationKey
    )

  }

  async function onChatCallReceived(result: RestResult<IdValueMetadata<number, PlatformUser>>) {
    if (!result.data) {
      return
    }
    const user = result.data.value
    if (user.systemName === principalStore.state.name) {
      return
    }

    const callEntity = result.data.metadata as unknown as UserChatCallResponseBody
    const description = fillLocale(callLocale.value.invitation, {
      user: AuthServerService.getPrincipalNameByUserDetails(user),
      type: getEnumName(callEntity.type),
    })
    const key = MESSAGE_SERVER_MESSAGE_GROUP.USER_CHAT_CALL + "_" + String(callEntity.id)
    const TypeIcon = isEnumValue(callEntity.type, MESSAGE_SERVER_CHAT_CALL_TYPE.VIDEO)
      ? VideoCameraOutlined
      : AudioOutlined
    await info({
        title: h(Flex, {align: 'center', justify: 'space-between'}, () => [
          h('span', {}, getEnumName(callEntity.type)),
          h(TypeIcon),
        ]),
        duration: false,
        description: createNotificationDescription(description),
        icon: createUserAvatarNode(user, 'large'),
        closable: false,
        actions: h(ImCallActions, {callId: Number(callEntity.id)}),
      },
      MESSAGE_SERVER_MESSAGE_GROUP.USER_CHAT_CALL,
      key
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

  on(
    SOCKET_EVENT_TYPE.CHAT_CALL,
    (payload) => onChatCallReceived(parseSocketRestPayload<IdValueMetadata<number, PlatformUser>>(payload))
  )

  on(
    SOCKET_EVENT_TYPE.CHAT_CALL_UPDATE,
    (payload) => {
      const result = parseSocketRestPayload<UserChatCallEntity>(payload)
      if (result.data) {
        session.onCallUpdate(result.data)
      }
    },
  )

  on(
    SOCKET_EVENT_TYPE.CHAT_CALL_COMPLETED,
    (payload) => {
      const result = parseSocketRestPayload<UserChatCallEntity>(payload)
      if (result.data) {
        session.onCallCompleted(result.data)
      }
    },
  )

  on(
    SOCKET_EVENT_TYPE.CHAT_CALL_PARTICIPANT_UPDATE,
    (payload) => {
      const result = parseSocketRestPayload<UserChatCallParticipantEntity>(payload)
      if (result.data) {
        session.onParticipantUpdate(result.data)
      }
    },
  )

  on(
    SOCKET_EVENT_TYPE.CHAT_CALL_CONFIRM,
    (payload) => {
      const result = parseSocketRestPayload<UserChatCallParticipantEntity>(payload)
      if (result.data) {
        void session.onCallConfirm(result.data)
      }
    },
  )
}
