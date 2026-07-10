<script setup lang="ts">

import {computed, onMounted, onUnmounted, ref} from "vue";
import {getEnumName, getEnumValue} from "@/utils";
import {DATE_TIME_FORMAT} from "@/constants/systemConstant.ts";
import {getCallIcon} from "@/utils/chatCallUtils.ts";
import {type ChatCallModalInnerProps, useChatCallModalExpose} from "@/composables";
import LChatCallPrivateTypeLayout from "@/components/chat/ChatCallPrivateTypeLayout.vue";

defineOptions({
  name: 'LChatCallModel',
})

const chatCallModelContext = useChatCallModalExpose()
const callViewportRef = ref<HTMLDivElement>()

const modal = computed(() => chatCallModelContext.context.modal as ChatCallModalInnerProps)
const isNativeFullscreen = computed(() => modal.value.fullscreen ?? false)

const viewportStyle = computed(() => {
  if (isNativeFullscreen.value || !modal.value.height) {
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
      :classes="{container: 'p-0', header: 'p-xs m-0 text-center'}"
      :mask-closable="false"
      :width="modal.width"
      :footer="null"
      @cancel="chatCallModelContext.handleCancel">
      <template #title>
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
            <a-button size="small">
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
        class="chat-call-viewport relative w-full rounded-b-lg group overflow-hidden bg-black"
        :class="isNativeFullscreen || !modal.height ? 'size-full min-h-100' : undefined"
        :style="viewportStyle"
      >
        <l-chat-call-private-type-layout v-if="getEnumValue(chatCallModelContext.context.userChatCall.scene) === 10" />
        <a-flex gap="small" v-if="modal.closeTimerValue" justify="center" class="absolute bottom-0 left-0 w-full p-xs bg-container opacity-60" align="center">
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

<style scoped>
.chat-call-viewport:fullscreen {
  width: 100%;
  height: 100%;
  min-height: 100%;
  border-radius: 0;
  max-width: none;
  max-height: none;
}

.chat-call-viewport:fullscreen :deep(.relative) {
  min-height: 100%;
  height: 100%;
}
</style>
