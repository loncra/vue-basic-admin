<script setup lang="ts">

import {getEnumName, getEnumValue} from "@/utils";
import {computed, nextTick, ref} from "vue";
import type {UserChatCallResponseBody} from "@/types/apis";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {ChatCallService} from "@/apis/message-server/chatCallService.ts";

defineOptions({
  name: 'LChatCallModel',
})

const configProviderStore = useConfigProviderStore()

const chatCallModel = ref<{
  open: boolean
  title:string
  loading:boolean
  stream?:MediaStream
}>({
  loading: false,
  open:false,
  title:' '
})

const userChatCall = ref<UserChatCallResponseBody>()

const videoRef = ref<HTMLVideoElement>()

async function openChatCallModel(
  title:string,
  stream:MediaStream,
  _userChatCall:UserChatCallResponseBody
) {
  chatCallModel.value.open = true;
  chatCallModel.value.title = title;
  chatCallModel.value.stream = stream

  userChatCall.value = _userChatCall;
  await nextTick();
  if (videoRef.value) {
    videoRef.value.srcObject = stream
  }
}

function stopLocalStream() {
  chatCallModel.value.stream?.getTracks().forEach((track) => track.stop())
  chatCallModel.value.stream = undefined
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
}

const privateChatParticipant = computed(() => (userChatCall.value?.participants || []).find(p => getEnumValue(p.type) !== 31))

async function handleCancel() {
  try {
    chatCallModel.value.loading = true
    if (userChatCall.value) {
      await ChatCallService.completed(Number(userChatCall.value.id))
    }
    chatCallModel.value.open = false
    stopLocalStream()
  } finally {
    chatCallModel.value.loading = false
  }
}

defineExpose({
  openChatCallModel
})

</script>

<template>
  <teleport to="body">
    <a-modal
      :open="chatCallModel.open && userChatCall !== undefined"
      :closable="false"
      :classes="{container: 'p-0', header: 'p-xs m-0 text-center'}"
      :mask-closable="false"
      :width="(chatCallModel?.stream?.getVideoTracks().at(-1)?.getSettings()?.width || 0) / 1.5"
      :footer="null"
      @cancel="handleCancel">
      <template #title>
        <a-flex justify="space-between" align="center">
          <a-typography-text>
            {{chatCallModel.title}}
          </a-typography-text>
          <a-space-compact class="opacity-80">
            <a-button size="small">
              <template #icon>
                <icon-font type="loncra-expand"/>
              </template>
            </a-button>
            <a-button size="small">
              <template #icon>
                <icon-font type="loncra-picture-in-picture"/>
              </template>
            </a-button>
            <a-button size="small" danger type="primary" :loading="chatCallModel.loading" @click="handleCancel">
              <template #icon>
                <icon-font type="loncra-x"/>
              </template>
            </a-button>
          </a-space-compact>
        </a-flex>
      </template>
      <div class="relative size-full bg-black rounded-b-lg group overflow-hidden" v-if="getEnumValue(userChatCall?.room.type) === 20">
        <video
          ref="videoRef"
          class="block size-full opacity-99 object-contain"
          autoplay
          playsinline
          muted
        />
        <a-flex
          vertical
          justify="space-evenly"
          align="center"
          class="absolute opacity-80 shadow-card bg-container top-0 left-0 w-30 h-40 rounded-lg border border-border-secondary m-xs"
          v-if="privateChatParticipant"
        >
          <l-user-avatar class="" :size="configProviderStore.getToken().sizeXL * 2" :user="privateChatParticipant.metadata.details" />
          <a-typography-text type="secondary">
            <a-badge status="processing" :text="getEnumName(privateChatParticipant.status)" />
          </a-typography-text>
        </a-flex>
        <a-flex
          justify="space-between"
          align="center"
          class="absolute bottom-0 left-0 w-full p-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <a-space-compact>
            <a-button class="opacity-30" variant="outlined">
              <template #icon>
                <icon-font type="loncra-mic-off"/>
              </template>
            </a-button>
            <a-button class="opacity-30" variant="outlined">
              <template #icon>
                <icon-font type="loncra-video-off"/>
              </template>
            </a-button>
          </a-space-compact>
          <a-space>
            <a-button
              class="opacity-50"
              shape="circle"
              type="primary"
              danger
              @click="handleCancel"
              :loading="chatCallModel.loading"
            >
              <template #icon>
                <icon-font type="loncra-power"/>
              </template>
            </a-button>
          </a-space>
        </a-flex>
      </div>
    </a-modal>
  </teleport>
</template>
