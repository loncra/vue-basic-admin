<script setup lang="ts">

import {getEnumName, getEnumValue} from "@/utils";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import {usePrivateChatCallLayout} from "@/composables";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {onMounted} from "vue";

defineOptions({
  name: 'LChatCallPrivateTypeLayout',
})

const configProviderStore = useConfigProviderStore();

const miniWindowClass = "absolute opacity-80 top-0 left-0 w-30 h-40 rounded-lg border border-border-secondary m-xs shadow-card bg-container cursor-pointer"

const {
  targetParticipant,
  options,
  chatCallExpose,
  toggleMicrophone,
  toggleCamera,
  mounted,
  localParticipantVideoRef,
  remoteParticipantVideoRef,
  remoteMediaState,
  changeFullWindow,
  getLocalParticipantVideoStyle
} = usePrivateChatCallLayout()

onMounted(mounted)

</script>

<template>
  <video
    ref="localParticipantVideoRef"
    @click="options.targetFullWindow ? changeFullWindow() : undefined"
    :class="[
      'block opacity-99 object-contain',
      options.targetFullWindow ? miniWindowClass : 'size-full'
    ]"
    :style="getLocalParticipantVideoStyle()"
    autoplay
    playsinline
    muted
  />

  <template
    v-if="targetParticipant"
  >
    <a-flex
      vertical
      justify="center"
      align="center"
      gap="small"
      @click="!options.targetFullWindow ? changeFullWindow() : undefined"
      :class="[
        options.targetFullWindow ? 'min-h-100' : miniWindowClass,
      ]"
      v-if="getEnumValue(targetParticipant.status) !== 40"
    >
      <l-user-avatar class="" :size="configProviderStore.getToken().sizeXL * 2" :user="targetParticipant.metadata.details" />
      <a-typography-text type="secondary">
        <a-badge :status="targetParticipant.badgeStatus" :text="getEnumName(targetParticipant.status)" />
      </a-typography-text>
    </a-flex>
    <video
      v-else
       @click="!options.targetFullWindow ? changeFullWindow() : undefined"
      :class="[
        options.targetFullWindow ? 'size-full min-h-100' : miniWindowClass
      ]"
      ref="remoteParticipantVideoRef"
      autoplay
      playsinline
    />
  </template>

  <a-flex
    v-if="getEnumValue(chatCallExpose.context.userChatCall?.status) !== 30"
    justify="space-between"
    align="center"
    class="absolute bottom-0 left-0 w-full p-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
    <a-space-compact>
      <a-button class="opacity-30" variant="outlined" @click="toggleMicrophone">
        <template #icon>
          <icon-font :type="options.microphoneEnabled ? 'loncra-mic-off' : 'loncra-mic'"/>
        </template>
      </a-button>
      <a-button class="opacity-30" variant="outlined" @click="toggleCamera">
        <template #icon>
          <icon-font :type="options.cameraEnabled ? 'loncra-video-off' : 'loncra-video'"/>
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
        :loading="chatCallExpose.context.modal.loading"
      >
        <template #icon>
          <icon-font type="loncra-power"/>
        </template>
      </a-button>
    </a-space>
  </a-flex>
</template>
