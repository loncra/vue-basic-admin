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

const {
  targetParticipant,
  options,
  chatCallExpose,
  toggleMicrophone,
  toggleCamera,
  toggleSplitScreen,
  mounted,
  localParticipantVideoRef,
  remoteParticipantVideoRef,
  remoteVideoConnected,
  isLeftRightSplit,
  changeFullWindow,
  getVideoPanelClass,
  getVideoPanelStyle,
  contentStyle,
  rootClass,
} = usePrivateChatCallLayout()

onMounted(mounted)

</script>

<template>
  <div :class="rootClass">
    <a-flex
      v-if="isLeftRightSplit"
      class="size-full"
      :style="contentStyle"
      align="stretch"
    >
      <video
        ref="localParticipantVideoRef"
        :class="getVideoPanelClass('local')"
        :style="getVideoPanelStyle('local')"
        autoplay
        playsinline
        muted
      />
      <a-flex
        v-if="targetParticipant && !remoteVideoConnected"
        vertical
        justify="center"
        align="center"
        gap="small"
        :class="getVideoPanelClass('remote')"
        :style="getVideoPanelStyle('remote')"
      >
        <l-user-avatar :size="configProviderStore.getToken().sizeXL * 2" :user="targetParticipant.metadata.details" />
        <a-typography-text type="secondary">
          <a-badge :status="targetParticipant.badgeStatus" :text="getEnumName(targetParticipant.status)" />
        </a-typography-text>
      </a-flex>
      <video
        v-else-if="remoteVideoConnected"
        ref="remoteParticipantVideoRef"
        :class="getVideoPanelClass('remote')"
        :style="getVideoPanelStyle('remote')"
        autoplay
        playsinline
      />
    </a-flex>

    <div
      v-else
      :class="rootClass"
      :style="contentStyle"
    >
      <video
        ref="localParticipantVideoRef"
        :class="getVideoPanelClass('local')"
        :style="getVideoPanelStyle('local')"
        autoplay
        playsinline
        muted
        @click="options.targetFullWindow ? changeFullWindow() : undefined"
      />

      <template v-if="targetParticipant">
        <a-flex
          v-if="!remoteVideoConnected"
          vertical
          justify="center"
          align="center"
          gap="small"
          :class="getVideoPanelClass('remote')"
          :style="getVideoPanelStyle('remote')"
          @click="!options.targetFullWindow ? changeFullWindow() : undefined"
        >
          <l-user-avatar :size="configProviderStore.getToken().sizeXL * 2" :user="targetParticipant.metadata.details" />
          <a-typography-text type="secondary">
            <a-badge :status="targetParticipant.badgeStatus" :text="getEnumName(targetParticipant.status)" />
          </a-typography-text>
        </a-flex>
        <video
          v-else
          ref="remoteParticipantVideoRef"
          :class="getVideoPanelClass('remote')"
          :style="getVideoPanelStyle('remote')"
          autoplay
          playsinline
          @click="!options.targetFullWindow ? changeFullWindow() : undefined"
        />
      </template>
    </div>

    <a-flex
      v-if="getEnumValue(chatCallExpose.context.userChatCall?.status) !== 30"
      justify="space-between"
      align="center"
      class="absolute bottom-0 left-0 w-full p-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
    >
      <a-space-compact>
        <a-button class="opacity-30" variant="outlined" @click="toggleMicrophone">
          <template #icon>
            <icon-font :type="options.microphoneEnabled ? 'loncra-mic' : 'loncra-mic-off'"/>
          </template>
        </a-button>
        <a-button class="opacity-30" variant="outlined" @click="toggleCamera">
          <template #icon>
            <icon-font :type="options.cameraEnabled ? 'loncra-video' : 'loncra-video-off'"/>
          </template>
        </a-button>
        <a-button class="opacity-30" variant="outlined" @click="toggleSplitScreen">
          <template #icon>
            <icon-font :type="isLeftRightSplit ? 'loncra-picture-in-picture' : 'loncra-layout-template'"/>
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
  </div>
</template>
