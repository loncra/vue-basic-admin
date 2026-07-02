<script setup lang="ts">

import {getEnumName, getEnumValue} from "@/utils";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {useChatCallModel} from "@/composables/chat/useChatCallModel.ts";
import {toRef} from "vue";
import {DATE_TIME_FORMAT, TIME_UNIT_TYPE} from "@/constants/systemConstant.ts";
import type {TimeProperties} from "@/types/apis";

defineOptions({
  name: 'LChatCallModel',
})

const props = withDefaults(defineProps<{
  closeTimeValue?: TimeProperties
}>(), {
  closeTimeValue: () => ({
    value: 5,
    unit: TIME_UNIT_TYPE.SECONDS,
  }),
})

const configProviderStore = useConfigProviderStore()

const {
  openChatCallModel,
  handleCancel,
  privateChatParticipant,
  privateChatParticipantBadge,
  chatCallModel,
  userChatCall,
  videoRef
} = useChatCallModel({
  closeTimerValue: toRef(props,"closeTimeValue"),
})

defineExpose({
  openChatCallModel
})

</script>

<template>
  <teleport to="body">
    <a-modal
      :open="chatCallModel.open"
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

          <a-typography-text v-if="userChatCall">
            ({{getEnumName(userChatCall.status)}})
            <a-statistic-timer
              :value="userChatCall.startTime"
              :format="DATE_TIME_FORMAT.POST_DATETIME_FORMAT"
              v-if="getEnumValue(userChatCall.status) === 20"
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
            <a-badge :status="privateChatParticipantBadge" :text="getEnumName(privateChatParticipant.status)" />
          </a-typography-text>
        </a-flex>
        <a-flex
          v-if="getEnumValue(userChatCall?.status) !== 30"
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
        <a-flex gap="small" v-if="chatCallModel.closeTimerValue" justify="center" class="absolute bottom-0 left-0 w-full p-xs bg-container opacity-60" align="center">
          <a-statistic-timer
            :value="chatCallModel.closeTimerValue"
            type="countdown"
            :classes="{content:'text-DEFAULT'}"
            :format="$t('chat.call.closeCountdown')"
            @finish="() => handleCancel()"
          />
        </a-flex>
      </div>
    </a-modal>
  </teleport>
</template>
