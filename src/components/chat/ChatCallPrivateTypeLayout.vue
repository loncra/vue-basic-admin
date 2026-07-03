<script setup lang="ts">

import {getEnumName} from "@/utils";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import {usePrivateChatCallLayout} from "@/composables";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {onMounted, ref} from "vue";

defineOptions({
  name: 'LChatCallPrivateTypeLayout',
})

const configProviderStore = useConfigProviderStore();

const miniWindowClass = "absolute opacity-80 top-0 left-0 w-30 h-40 rounded-lg border border-border-secondary m-xs shadow-card bg-container cursor-pointer"

const videoRef = ref<HTMLVideoElement>();

const {
  calleeParticipant,
  calleeFullWindow,
  chatCallExpose,
  changeFullWindow,
} = usePrivateChatCallLayout()

function mounted(){
  if (!videoRef.value || !chatCallExpose.context?.localStream) {
    return
  }

  videoRef.value.srcObject = chatCallExpose.context.localStream
}

onMounted(mounted)

</script>

<template>
  <video
    ref="videoRef"
    @click="calleeFullWindow ? changeFullWindow() : undefined"
    :class="[
      'block opacity-99 object-contain',
      calleeFullWindow ? miniWindowClass : 'size-full'
    ]"
    autoplay
    playsinline
    muted
  />
  <a-flex
    vertical
    justify="center"
    align="center"
    gap="small"
    @click="!calleeFullWindow ? changeFullWindow() : undefined"
    :class="[
      calleeFullWindow ? 'min-h-100' : miniWindowClass
    ]"
    v-if="calleeParticipant"
  >
    <l-user-avatar class="" :size="configProviderStore.getToken().sizeXL * 2" :user="calleeParticipant.metadata.details" />
    <a-typography-text type="secondary">
      <a-badge :status="calleeParticipant.badgeStatus" :text="getEnumName(calleeParticipant.status)" />
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
        @click="chatCallExpose.handleCancel"
        :loading="chatCallExpose.context.model.loading"
      >
        <template #icon>
          <icon-font type="loncra-power"/>
        </template>
      </a-button>
    </a-space>
  </a-flex>
</template>
