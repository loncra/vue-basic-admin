<script setup lang="ts">
import HomeLayout from '@/components/layout/HomeLayout.vue'
import LChatCallModel from "@/components/chat/ChatCallModel.vue";
import {useChatNotification} from "@/composables/chat/useChatNotification.ts";
import {provide} from "vue";
import {HOME_CHAT_CALL_MODEL_OPEN_PROVIDE_KEY} from "@/constants/systemConstant.ts";
import type {UserChatCallResponseBody} from "@/types/apis";

defineOptions({
  name: 'IndexHome',
})

const {chatCallModeRef} = useChatNotification()

provide(HOME_CHAT_CALL_MODEL_OPEN_PROVIDE_KEY, (
  title:string,
  stream:MediaStream,
  _userChatCall:UserChatCallResponseBody
) => {
  chatCallModeRef.value?.openChatCallModel(title,stream, _userChatCall)
})

</script>

<template>
  <div>
    <home-layout/>
    <l-chat-call-model ref="chatCallModeRef" />
  </div>
</template>
