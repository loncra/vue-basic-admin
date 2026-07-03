<script setup lang="ts">

import {getEnumName, getEnumValue} from "@/utils";
import {DATE_TIME_FORMAT} from "@/constants/systemConstant.ts";
import {getCallIcon} from "@/utils/chatCallUtils.ts";
import {type ChatCallModelInnerProps, useChatCallModelExpose} from "@/composables";
import LChatCallPrivateTypeLayout from "@/components/chat/ChatCallPrivateTypeLayout.vue";

defineOptions({
  name: 'LChatCallModel',
})

const chatCallModelContext = useChatCallModelExpose()

</script>

<template>
  <teleport to="body" v-if="chatCallModelContext.context.userChatCall">
    <a-modal
      :open="(chatCallModelContext.context.model as ChatCallModelInnerProps).open"
      :closable="false"
      :classes="{container: 'p-0', header: 'p-xs m-0 text-center'}"
      :mask-closable="false"
      :width="(chatCallModelContext.context?.localStream?.getVideoTracks().at(-1)?.getSettings()?.width || 0) / 1.5"
      :footer="null"
      @cancel="chatCallModelContext.handleCancel">
      <template #title>
        <a-flex justify="space-between" align="center">
          <a-space>
            <icon-font :type="getCallIcon(chatCallModelContext.context.userChatCall.type)" />
            <a-typography-text>
              {{chatCallModelContext.context.model.title}}
            </a-typography-text>
          </a-space>

          <a-typography-text>
            ({{getEnumName(chatCallModelContext.context.userChatCall.status)}})
            <a-statistic-timer
              :value="chatCallModelContext.context.userChatCall.startTime"
              :format="DATE_TIME_FORMAT.POST_DATETIME_FORMAT"
              v-if="getEnumValue(chatCallModelContext.context.userChatCall.status) === 20"
              :classes="{content:'text-DEFAULT'}"
              type="countup"
            />
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
            <a-button size="small" danger type="primary" :loading="chatCallModelContext.context.model.loading" @click="chatCallModelContext.handleCancel">
              <template #icon>
                <icon-font type="loncra-x"/>
              </template>
            </a-button>
          </a-space-compact>
        </a-flex>
      </template>
      <div class="relative size-full rounded-b-lg group overflow-hidden">
        <l-chat-call-private-type-layout v-if="getEnumValue(chatCallModelContext.context.userChatCall.scene) === 10" />
        <a-flex gap="small" v-if="(chatCallModelContext.context.model as ChatCallModelInnerProps).closeTimerValue" justify="center" class="absolute bottom-0 left-0 w-full p-xs bg-container opacity-60" align="center">
          <a-statistic-timer
            :value="(chatCallModelContext.context.model as ChatCallModelInnerProps).closeTimerValue"
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
