<script setup lang="ts">
import HomeLayout from '@/components/layout/HomeLayout.vue'
import {useChatNotification} from "@/composables";
import {toRef} from "vue";
import {TIME_UNIT_TYPE} from '@loncra/client/commons';
import type {TimeProperties} from "@loncra/client/commons";
import {ImCallWindow, registerImCallMedia} from '@loncra/antdv-chat-pro/im/call'
import {createLiveKitCallMedia} from '@loncra/antdv-chat-pro/im/call/livekit'

defineOptions({
  name: 'IndexHome',
})

registerImCallMedia(createLiveKitCallMedia)

const props = withDefaults(defineProps<{
  closeTimeValue?: TimeProperties
}>(), {
  closeTimeValue: () => ({
    value: 5,
    unit: TIME_UNIT_TYPE.SECONDS,
  }),
})

useChatNotification({
  chatCallConfig:{
    closeTimerValue: toRef(props,"closeTimeValue")
  }
})

</script>

<template>
  <div>
    <home-layout/>
    <ImCallWindow />
  </div>
</template>
