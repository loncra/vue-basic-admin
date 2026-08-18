<script setup lang="ts">
import HomeLayout from '@/components/layout/HomeLayout.vue'
import LChatCallModel from "@/components/message-server/chat/ChatCallModel.vue";
import {useChatNotification} from "@/composables";
import {toRef} from "vue";
import {TIME_UNIT_TYPE} from "@/constants";
import type {TimeProperties} from "@/types/apis";

defineOptions({
  name: 'IndexHome',
})

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
    <l-chat-call-model />
  </div>
</template>
