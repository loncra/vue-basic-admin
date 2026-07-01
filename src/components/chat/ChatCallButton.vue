<script setup lang="ts">

import useApp from "antdv-next/dist/app/useApp";
import {type ComponentInternalInstance, getCurrentInstance, inject} from "vue";
import {HOME_CHAT_CALL_MODEL_OPEN_PROVIDE_KEY} from "@/constants/systemConstant.ts";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import type {
  ChatCallType,
  IdValueMetadata,
  RestResult,
  UserChatCallResponseBody,
  UserChatParticipantEntity
} from "@/types/apis";
import type {MenuItemType} from "antdv-next";
import {CHAT_CALL_TYPE} from "@/constants/messageConstant.ts";
import {createIcon, requireNonNullOrUndefined} from "@/utils";
import type {ServerConversationItem} from "@/types/composables";
import {ChatCallService} from "@/apis/message-server/chatCallService.ts";

defineOptions({
  name: 'LChatCallButton',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const props = withDefaults(defineProps<{
  constraints?:{
    video:MediaStreamConstraints,
    voice:MediaTrackConstraints
  }
  participants:UserChatParticipantEntity[]
  conversation:ServerConversationItem
}>(),{
})

const {message} = useApp()

const principalStore = usePrincipalStore()

const openChatCallModel = inject<(title:string, stream:MediaStream, userChatCall:UserChatCallResponseBody) => void>(HOME_CHAT_CALL_MODEL_OPEN_PROVIDE_KEY)

const items: MenuItemType[] = [
  {
    label: globalProperties.$t('chat.call.video'),
    key: CHAT_CALL_TYPE.VIDEO,
    icon:createIcon('loncra-video')
  },
  {
    label: globalProperties.$t('chat.call.voice'),
    key: CHAT_CALL_TYPE.VOICE,
    icon:createIcon('loncra-mic')
  },
]

async function videoCall() {
  if (!props.conversation.data) {
    return
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    message.error('当前浏览器不支持用户媒体调用');
    return
  }
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia(props.constraints?.video)
    const principals = props.participants.filter(p => p.principal !== principalStore.state.name).map(p => p.principal)
    const createResult = await ChatCallService.create(
      Number(props.conversation.data.room.id),
      CHAT_CALL_TYPE.VIDEO,
      principals
    )
    if (!createResult.data) {
      return
    }
    openChatCallModel?.(
      props.conversation.label + ' ' + globalProperties.$t('chat.call.video') ,
      stream,
      createResult.data
    )
  } catch (err) {
    // 用户拒绝 / 没有摄像头 / 被占用 等
    console.error(err)
    if (stream) {
      stream?.getTracks().forEach((track) => track.stop())
    }
  }
}

function onMenuClick(e: { key: string}) {
  if (e.key === CHAT_CALL_TYPE.VIDEO) {
    videoCall()
  } else if (e.key === CHAT_CALL_TYPE.VOICE) {

  }
}

</script>

<template>
  <a-dropdown :menu="{ items }" :trigger="['click']" arrow placement="topRight" @menuClick="onMenuClick">
    <a-button v-bind="$attrs" >
      <template #icon>
        <icon-font type="loncra-phone"/>
      </template>
    </a-button>
  </a-dropdown>

</template>
