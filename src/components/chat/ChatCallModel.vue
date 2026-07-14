<script setup lang="ts">

import {type Component, computed, onMounted, onUnmounted, ref} from "vue";
import {getEnumName, getEnumValue} from "@/utils";
import {DATE_TIME_FORMAT} from "@/constants/systemConstant.ts";
import {getCallIcon} from "@/utils/chatCallUtils.ts";
import {provideChatCallMedia, useChatCallModalExpose,} from "@/composables";
import type {ChatCallModalInnerProps} from "@/types/composables";
import LChatCallPrivateTypeLayout from "@/components/chat/ChatCallPrivateTypeLayout.vue";
import {
  CHAT_CALL_MINI_SIZE,
  CHAT_CALL_SCENE,
  CHAT_CALL_UI_MODE,
} from "@/constants/messageConstant.ts";

defineOptions({
  name: 'LChatCallModel',
})

const chatCallModelContext = useChatCallModalExpose()
const callMedia = provideChatCallMedia()
const {mediaOptions, toggleMicrophone, toggleCamera} = callMedia
const callViewportRef = ref<HTMLDivElement>()

/** scene → 画面布局组件（会议/直播在此注册） */
const CALL_LAYOUT_BY_SCENE: Record<number, Component> = {
  [CHAT_CALL_SCENE.PRIVATE]: LChatCallPrivateTypeLayout,
}

const modal = computed(() => chatCallModelContext.context.modal as ChatCallModalInnerProps)
const isNativeFullscreen = computed(() => modal.value.fullscreen ?? false)
const isCallMinimized = computed(() => modal.value.uiMode === CHAT_CALL_UI_MODE.MINIMIZED)
const isCallExpanded = computed(() => !isCallMinimized.value)
const showMediaToolbar = computed(() =>
  isCallExpanded.value && getEnumValue(chatCallModelContext.context.userChatCall?.status) !== 30,
)

const callLayout = computed(() => {
  const scene = chatCallModelContext.context.userChatCall?.scene
  if (!scene) {
    return undefined
  }
  return CALL_LAYOUT_BY_SCENE[getEnumValue(scene)]
})

const modalWidth = computed(() =>
  isCallMinimized.value ? CHAT_CALL_MINI_SIZE.WIDTH : modal.value.width,
)

const viewportStyle = computed(() => {
  if (isNativeFullscreen.value) {
    return undefined
  }
  if (isCallMinimized.value) {
    return {height: `${CHAT_CALL_MINI_SIZE.HEIGHT}px`}
  }
  if (!modal.value.height) {
    return undefined
  }
  return {height: `${modal.value.height}px`}
})

function isViewportFullscreen() {
  return document.fullscreenElement === callViewportRef.value
}

async function toggleNativeFullscreen() {
  const el = callViewportRef.value
  if (!el) {
    return
  }
  try {
    if (!isViewportFullscreen()) {
      await el.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch (error) {
    console.error(error)
  }
}

function onFullscreenChange() {
  chatCallModelContext.setCallFullscreen(isViewportFullscreen())
}

function onCallViewportClick() {
  if (isCallMinimized.value) {
    chatCallModelContext.setCallUiMode(CHAT_CALL_UI_MODE.EXPANDED)
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})

</script>

<template>
  <teleport to="body" v-if="chatCallModelContext.context.userChatCall">
    <a-modal
      :open="modal.open"
      :closable="false"
      :destroy-on-hidden="false"
      :centered="isCallExpanded"
      :keyboard="false"
      :mask="isCallExpanded"
      :wrap-class-name="isCallMinimized ? 'chat-call-modal--minimized' : undefined"
      :classes="{container: 'p-0', header: 'p-xs m-0 text-center'}"
      :mask-closable="false"
      :width="modalWidth"
      :footer="null"
      @cancel="chatCallModelContext.handleCancel">
      <template v-if="isCallExpanded" #title>
        <a-flex justify="space-between" align="center">
          <a-space>
            <icon-font :type="getCallIcon(chatCallModelContext.context.userChatCall.type)" />
            <a-typography-text>
              {{ modal.title }}
            </a-typography-text>
          </a-space>

          <a-typography-text>
            ({{getEnumName(chatCallModelContext.context.userChatCall.status)}})
            <a-statistic-timer
              :value="chatCallModelContext.context.userChatCall.startTime"
              :format="DATE_TIME_FORMAT.POST_TIME_FORMAT"
              v-if="getEnumValue(chatCallModelContext.context.userChatCall.status) === 20"
              :classes="{root:'inline-block',content:'text-DEFAULT'}"
              type="countup"
            />
          </a-typography-text>

          <a-space-compact class="opacity-80">
            <a-button size="small" @click="toggleNativeFullscreen">
              <template #icon>
                <icon-font :type="isNativeFullscreen ? 'loncra-minimize' : 'loncra-expand'"/>
              </template>
            </a-button>
            <a-button size="small" @click="chatCallModelContext.toggleCallMinimize()">
              <template #icon>
                <icon-font type="loncra-picture-in-picture"/>
              </template>
            </a-button>
            <a-button size="small"
              danger
              type="primary"
              :loading="modal.loading"
              @click="chatCallModelContext.handleCancel"
              >
              <template #icon>
                <icon-font type="loncra-x"/>
              </template>
            </a-button>
          </a-space-compact>
        </a-flex>
      </template>
      <div
        ref="callViewportRef"
        class="chat-call-viewport relative w-full overflow-hidden bg-black"
        :class="[
          isCallMinimized ? 'rounded-lg cursor-pointer' : 'rounded-b-lg group',
          isNativeFullscreen || (!modal.height && isCallExpanded) ? 'size-full min-h-100' : undefined,
        ]"
        :style="viewportStyle"
        @click="onCallViewportClick"
      >
        <component :is="callLayout" v-if="callLayout" />
        <a-flex
          v-if="showMediaToolbar"
          justify="space-between"
          align="center"
          class="absolute bottom-0 left-0 z-20 w-full p-xs opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          @click.stop
        >
          <a-space-compact>
            <a-button class="opacity-30" variant="outlined" @click="toggleMicrophone">
              <template #icon>
                <icon-font :type="mediaOptions.microphoneEnabled ? 'loncra-mic' : 'loncra-mic-off'"/>
              </template>
            </a-button>
            <a-button class="opacity-30" variant="outlined" @click="toggleCamera">
              <template #icon>
                <icon-font :type="mediaOptions.cameraEnabled ? 'loncra-video' : 'loncra-video-off'"/>
              </template>
            </a-button>
          </a-space-compact>
          <a-space>
            <a-button
              class="opacity-50"
              shape="circle"
              type="primary"
              danger
              :loading="modal.loading"
              @click="chatCallModelContext.handleCancel"
            >
              <template #icon>
                <icon-font type="loncra-power"/>
              </template>
            </a-button>
          </a-space>
        </a-flex>
        <a-flex
          gap="small"
          v-if="modal.closeTimerValue && isCallExpanded"
          justify="center"
          class="absolute bottom-0 left-0 w-full p-xs bg-container opacity-60"
          align="center"
        >
          <a-statistic-timer
            :value="modal.closeTimerValue"
            type="countdown"
            :classes="{content:'text-DEFAULT'}"
            :format="$t('chat.call.closeCountdown')"
            @finish="() => chatCallModelContext.handleCancel()"
          />
        </a-flex>
      </div>
    </a-modal>
  </teleport>
</template>
