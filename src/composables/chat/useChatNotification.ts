import {
  provideChatCllExpose,
  type UseChatCallModelParams,
  useSocketSubscriptions
} from "@/composables";
import {MESSAGE_GROUP, SOCKET_EVENT_TYPE} from "@/constants/messageConstant.ts";
import {parseSocketRestPayload} from "@/types/socket.ts";
import type {
  IdValueMetadata,
  PlatformUser,
  RestResult,
  UserChatCallEntity,
  UserChatCallResponseBody,
  UserChatConversationEntity,
  UserChatConversationResponseBody,
  UserChatMessageResponseBody
} from "@/types/apis";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.ts";
import {
  createAvatarNode,
  createIcon,
  createUserAvatarNode,
  getDevicesUserMedia,
  getEnumName,
  getEnumValue,
  getMessageContent,
  requireNonNullOrUndefined
} from "@/utils";
import {AuthServerService} from "@/apis";
import {type ComponentInternalInstance, getCurrentInstance, h, type Ref, ref} from "vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {useAppNotification} from "@/composables/useAppNotification.ts";
import {Button, Flex, Space} from "antdv-next";
import {ChatCallService} from "@/apis/message-server/chatCallService.ts";
import useApp from "antdv-next/dist/app/useApp";
import {isBusinessSuccess} from "@/requests";
import {getCallIcon, getMediaStreamConstraintsByCall} from "@/utils/chatCallUtils.ts";

export interface UseChatNotificationParam {
  chatCallConfig:UseChatCallModelParams
}

export function useChatNotification(config:UseChatNotificationParam) {
  const {on} = useSocketSubscriptions()
  const {destroy, info, createNotificationDescription} = useAppNotification()
  const {message} = useApp()

  const chatCallExport = provideChatCllExpose(config.chatCallConfig)

  const messageServerStore = useMessageServerStore()
  const principalStore = usePrincipalStore()
  const configProviderStore = useConfigProviderStore()
  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  async function onChatMessageReceived(
    result: RestResult<UserChatMessageResponseBody>,
    event: string
  ) {
    if (!result.data || result.data.principal === principalStore.state.name) {
      return
    }

    await messageServerStore.fetchUnreadQuantity()
    if (globalProperties.$route.name === 'my_chat_message') {
      return
    }

    const conversationResult: RestResult<UserChatConversationEntity | UserChatConversationResponseBody> = await ChatMessageService.getConversation(result.data.userChatRoomId, true)
    if (!conversationResult.data) {
      return;
    }

    const body: UserChatConversationResponseBody = conversationResult.data as UserChatConversationResponseBody;
    let notificationKey = MESSAGE_GROUP.USER_CHAT + "_" + body.id;
    let description: string = getMessageContent(result.data, body)
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
        icon: createAvatarNode(body.cover, body.name, 'large', '[&>*:not(:first-child)]:-ms-8!'),
        classes:{
          root: 'cursor-pointer',
        },
        onClick: () => globalProperties.$router.push({
          name: 'my_chat_message',
          query: {conversationId: body.id, messageId}
        })
      },
      MESSAGE_GROUP.USER_CHAT,
      notificationKey
    )

  }

  async function acceptCall(callEntity:UserChatCallResponseBody, user:PlatformUser, loading:Ref<boolean>) {
    try {
      loading.value = true
      const result = await ChatCallService.accept(Number(callEntity.id))
      if (isBusinessSuccess(result)) {
        destroy(MESSAGE_GROUP.USER_CHAT_CALL + "_" +  String(callEntity.id))
      }
      await messageServerStore.fetchUnreadQuantity()

      const name = AuthServerService.getPrincipalNameByUserDetails(user)

      let defaultTitle;
      if (getEnumValue(callEntity.type) === 10) {
        defaultTitle = globalProperties.$t("chat.call.video.title",{user:name})
      } else {
        defaultTitle = globalProperties.$t("chat.call.voice.title",{user:name})
      }

      const stream = await getDevicesUserMedia(getMediaStreamConstraintsByCall(callEntity))
      chatCallExport.openChatCallModel(defaultTitle, stream, callEntity)
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
    } finally {
      loading.value = false
    }
  }

  async function rejectedCall(callEntity:UserChatCallEntity, loading:Ref<boolean>) {
    try {
      loading.value = true
      const result = await ChatCallService.rejected(Number(callEntity.id))
      if (isBusinessSuccess(result)) {
        destroy(MESSAGE_GROUP.USER_CHAT_CALL + "_" +  String(callEntity.id))
      }
      await messageServerStore.fetchUnreadQuantity()
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error))
    } finally {
      loading.value = false
    }
  }

  function createExtraIconTitle(title:string, icon:string) {
    return h(
      Flex,
      {
        align:'center',
        justify:'space-between',
      },
      () =>[
        h('span', {}, title),
        createIcon(icon)
      ]
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
    const description = globalProperties.$t(
      'chat.call.invitation',
      {
        user:AuthServerService.getPrincipalNameByUserDetails(user),
        type:getEnumName(callEntity.type)
      }
    )
    const key = MESSAGE_GROUP.USER_CHAT_CALL + "_" +  String(callEntity.id)
    const loading = ref<boolean>(false)
    await info({
        title: createExtraIconTitle(getEnumName(callEntity.type), String(getCallIcon(callEntity.type))),
        duration: false,
        description: createNotificationDescription(description),
        icon: createUserAvatarNode(user, 'large'),
        closable:false,
        actions: h(
          Space,
          {},
          () => [
            h(
              Button,
              {
                type:'link',
                size: 'small',
                onClick: () => destroy(key),
              },
              {
                icon:createIcon('loncra-message-square-off', 'align'),
                default: () => globalProperties.$t('common.ignore')
              },
            ),
            h(
              Button,
              {
                variant:"solid",
                color: 'green',
                size: 'small',
                loading:loading.value,
                onClick: () => acceptCall(callEntity, user, loading),
              },
              {
                icon:createIcon('loncra-message-square-check', 'align'),
                default: () => globalProperties.$t('common.accept')
              },
            ),
            h(
              Button,
              {
                danger:true,
                type: 'primary',
                size: 'small',
                loading:loading.value,
                onClick: () => rejectedCall(callEntity, loading),
              },
              {
                icon:createIcon('loncra-message-square-x', 'align'),
                default: () => globalProperties.$t('common.rejected')
              },
            )
          ]
        )
      },
      MESSAGE_GROUP.USER_CHAT_CALL,
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
}
