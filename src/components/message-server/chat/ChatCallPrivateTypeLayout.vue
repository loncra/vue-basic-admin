<script setup lang="ts">

import {getEnumName, getEnumValue} from "@/utils";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import {usePrivateChatCallLayout} from "@/composables";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {onMounted} from "vue";
import {CHAT_CALL_PRIVATE_ROLE_TYPE} from "@/constants/messageConstant.ts";

defineOptions({
  name: 'LChatCallPrivateTypeLayout',
})

const configProviderStore = useConfigProviderStore();

const {
  targetParticipant,
  localParticipantDetails,
  options,
  chatCallExpose,
  toggleSplitScreen,
  mounted,
  localParticipantVideoRef,
  remoteParticipantVideoRef,
  showParticipantVideo,
  isLeftRightSplit,
  isCallMinimized,
  changeFullWindow,
  getPanelShellClass,
  getPanelShellStyle,
  getPlaceholderPanelClass,
  getVideoElementClass,
  contentStyle,
  rootClass,
} = usePrivateChatCallLayout()

onMounted(mounted)

function onRemotePanelClick() {
  if (isCallMinimized.value) {
    return
  }
  if (!options.value.targetFullWindow) {
    changeFullWindow()
  }
}

</script>

<template>
  <div :class="rootClass">
    <a-flex
      v-if="isLeftRightSplit && !isCallMinimized"
      class="size-full"
      :style="contentStyle"
      align="stretch"
    >
      <a-flex
        v-if="!showParticipantVideo(CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL)"
        vertical
        justify="center"
        align="center"
        gap="small"
        :class="getPlaceholderPanelClass(CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL)"
        :style="getPanelShellStyle(CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL)"
      >
        <l-user-avatar
          v-if="localParticipantDetails"
          :size="configProviderStore.getToken().sizeXL * 2"
          :user="localParticipantDetails"
        />
      </a-flex>
      <video
        v-else
        ref="localParticipantVideoRef"
        :class="[getPanelShellClass(CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL), getVideoElementClass(CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL)]"
        :style="getPanelShellStyle(CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL)"
        autoplay
        playsinline
        muted
      />
      <a-flex
        v-if="targetParticipant && !showParticipantVideo(CHAT_CALL_PRIVATE_ROLE_TYPE.REMOTE)"
        vertical
        justify="center"
        align="center"
        gap="small"
        :class="getPlaceholderPanelClass(CHAT_CALL_PRIVATE_ROLE_TYPE.REMOTE)"
        :style="getPanelShellStyle(CHAT_CALL_PRIVATE_ROLE_TYPE.REMOTE)"
      >
        <l-user-avatar :size="configProviderStore.getToken().sizeXL * 2" :user="targetParticipant.metadata.details" />
        <a-badge :status="targetParticipant.badgeStatus" :text="getEnumName(targetParticipant.status)" />
        <a-statistic-timer
          v-if="targetParticipant.reconnectTime"
          :classes="{content:'text-DEFAULT text-text-secondary'}"
          :value="targetParticipant.reconnectTime"
          @finish="() => chatCallExpose.handleCancel()"
          type="countdown"
          :format="$t('chat.call.reconnectTimeCountdown')"
        />
      </a-flex>
      <video
        v-else-if="showParticipantVideo(CHAT_CALL_PRIVATE_ROLE_TYPE.REMOTE)"
        ref="remoteParticipantVideoRef"
        :class="[getPanelShellClass(CHAT_CALL_PRIVATE_ROLE_TYPE.REMOTE), getVideoElementClass(CHAT_CALL_PRIVATE_ROLE_TYPE.REMOTE)]"
        :style="getPanelShellStyle(CHAT_CALL_PRIVATE_ROLE_TYPE.REMOTE)"
        autoplay
        playsinline
      />
    </a-flex>

    <div
      v-else
      :class="rootClass"
      :style="contentStyle"
    >
      <a-flex
        v-if="!showParticipantVideo(CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL)"
        vertical
        justify="center"
        align="center"
        gap="small"
        :class="getPlaceholderPanelClass(CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL)"
        :style="getPanelShellStyle(CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL)"
        @click="options.targetFullWindow ? changeFullWindow() : undefined"
      >
        <l-user-avatar
          v-if="localParticipantDetails"
          :size="configProviderStore.getToken().sizeXL * 2"
          :user="localParticipantDetails"
        />
      </a-flex>
      <video
        v-else
        v-show="!isCallMinimized"
        ref="localParticipantVideoRef"
        :class="[getPanelShellClass(CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL), getVideoElementClass(CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL)]"
        :style="getPanelShellStyle(CHAT_CALL_PRIVATE_ROLE_TYPE.LOCAL)"
        autoplay
        playsinline
        muted
        @click="options.targetFullWindow ? changeFullWindow() : undefined"
      />

      <template v-if="targetParticipant">
        <a-flex
          v-if="!showParticipantVideo(CHAT_CALL_PRIVATE_ROLE_TYPE.REMOTE)"
          vertical
          justify="center"
          align="center"
          gap="small"
          :class="getPlaceholderPanelClass(CHAT_CALL_PRIVATE_ROLE_TYPE.REMOTE)"
          :style="getPanelShellStyle(CHAT_CALL_PRIVATE_ROLE_TYPE.REMOTE)"
          @click="onRemotePanelClick"
        >
          <l-user-avatar :size="configProviderStore.getToken().sizeXL * 2" :user="targetParticipant.metadata.details" />
          
          <a-badge :status="targetParticipant.badgeStatus" :text="getEnumName(targetParticipant.status)" />
          <a-statistic-timer
            v-if="targetParticipant.reconnectTime"
            :classes="{content:'text-DEFAULT text-text-secondary'}"
            :value="targetParticipant.reconnectTime"
            @finish="() => chatCallExpose.handleCancel()"
            type="countdown"
            :format="$t('chat.call.reconnectTimeCountdown')"
          />
        </a-flex>
        <video
          v-else
          ref="remoteParticipantVideoRef"
          :class="[getPanelShellClass(CHAT_CALL_PRIVATE_ROLE_TYPE.REMOTE), getVideoElementClass(CHAT_CALL_PRIVATE_ROLE_TYPE.REMOTE)]"
          :style="getPanelShellStyle(CHAT_CALL_PRIVATE_ROLE_TYPE.REMOTE)"
          autoplay
          playsinline
          @click="onRemotePanelClick"
        />
      </template>
    </div>

    <!-- 私聊专属：分屏切换（紧挨外壳麦/摄像头按钮） -->
    <a-button
      v-if="!isCallMinimized && getEnumValue(chatCallExpose.context.userChatCall?.status) !== 30"
      class="absolute bottom-0 left-19 z-30 m-xs opacity-0 transition-opacity duration-300 group-hover:opacity-30"
      variant="outlined"
      @click.stop="toggleSplitScreen"
    >
      <template #icon>
        <icon-font :type="isLeftRightSplit ? 'loncra-picture-in-picture' : 'loncra-layout-template'"/>
      </template>
    </a-button>
  </div>
</template>
