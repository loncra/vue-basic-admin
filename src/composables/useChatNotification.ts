import {useSocketSubscriptions} from '@/composables/useSocketSubscriptions.ts'
import {SOCKET_EVENT_TYPE} from '@/constants'
import type {IdValueMetadata, RestResult, TimeProperties} from "@loncra/client/commons";
import {getEnumName, isEnumValue} from '@loncra/client/commons';
import {createUserAvatarNode, parseSocketRestPayload} from '@loncra/antdv-chat-pro'
import {AuthServerService, type PlatformUser} from "@loncra/client/auth";
import type {
  UserChatCallEntity,
  UserChatCallParticipantEntity,
  UserChatCallResponseBody
} from "@loncra/client/message";
import {MESSAGE_SERVER_CHAT_CALL_TYPE, MESSAGE_SERVER_MESSAGE_GROUP} from "@loncra/client/message";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";

import {h, type Ref} from "vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {useAppNotification} from '@loncra/antdv-pro'
import {Flex} from "antdv-next";
import {AudioOutlined, VideoCameraOutlined} from '@antdv-next/icons'
import {fillLocale} from '@loncra/antdv'
import {ImCallActions, provideImChatCall, useLocale} from '@loncra/antdv-chat-pro/im/call'


export function useChatNotification(config: {
  chatCallConfig: {closeTimerValue: Ref<TimeProperties>}
}) {
  const {on} = useSocketSubscriptions()
  const {info, createNotificationDescription} = useAppNotification()
  const messageServerStore = useMessageServerStore()
  const principalStore = usePrincipalStore()

  const callLocale = useLocale('ImCall')
  const session = provideImChatCall({
    get self() {
      return {
        ...principalStore.state.details.metadata,
        systemName: principalStore.state.name,
      }
    },
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
        actions: h(ImCallActions, {callId: Number(callEntity.id), session}),
      },
      MESSAGE_SERVER_MESSAGE_GROUP.USER_CHAT_CALL,
      key
    )

  }

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
