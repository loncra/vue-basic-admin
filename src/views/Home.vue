<script setup lang="ts">
import HomeLayout from '@/components/layout/HomeLayout.vue'
import LChatCallModel from "@/components/chat/ChatCallModel.vue";
import {useChatNotification} from "@/composables/chat/useChatNotification.ts";

defineOptions({
  name: 'IndexHome',
})

useChatNotification()

</script>

<template>
  <div>
    <home-layout/>
    <l-chat-call-model ref="chatCallModeRef" />
  </div>
</template>
