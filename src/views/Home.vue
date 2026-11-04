<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, toRef} from "vue";
import HomeLayout from '@/components/layout/HomeLayout.vue'
import {useChatNotification} from "@/composables";
import type {TimeProperties} from "@loncra/client/commons";
import {TIME_UNIT_TYPE} from '@loncra/client/commons';
import {useImNotifications} from '@loncra/antdv-chat-pro'
import {ImCallWindow, registerImCallMedia} from '@loncra/antdv-chat-pro/im/call'
import {createLiveKitCallMedia} from '@loncra/antdv-chat-pro/im/call/livekit'
import {requireNonNullOrUndefined} from '@/utils'
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {useMessageServerStore} from "@/stores/messageServerStore.ts";
import {useSocketStore} from '@/stores/socketStore.ts'
import {registerAgentFilesystemExecutor} from '@/utils'
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {SYSTEM_ROUTE} from '@/constants'

defineOptions({
  name: 'IndexHome',
})

const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
  getCurrentInstance(),
).appContext.config.globalProperties

const props = withDefaults(defineProps<{
  closeTimeValue?: TimeProperties
}>(), {
  closeTimeValue: () => ({
    value: 5,
    unit: TIME_UNIT_TYPE.SECONDS,
  }),
})

const principalStore = usePrincipalStore()
const messageServerStore = useMessageServerStore()
const socketStore = useSocketStore()
const configProviderStore = useConfigProviderStore()

registerImCallMedia(createLiveKitCallMedia)
registerAgentFilesystemExecutor(socketStore)

useChatNotification({
  chatCallConfig:{
    closeTimerValue: toRef(props,"closeTimeValue")
  }
})

useImNotifications({
  subscribe: (event, handler) => socketStore.subscribe(
    event as Parameters<typeof socketStore.subscribe>[0],
    handler as Parameters<typeof socketStore.subscribe>[1],
  ),
  principal: () => principalStore.state.name,
  refreshUnread: async () => {
    await messageServerStore.fetchUnreadQuantity()
  },
  shouldNotify: () => globalProperties.$route.name !== SYSTEM_ROUTE.MY_CHAT_MESSAGE,
  openChatFromNotification: (conversationId, messageId) => {
    void globalProperties.$router.push({
      name: SYSTEM_ROUTE.MY_CHAT_MESSAGE,
      query: {conversationId, ...(messageId != null ? {messageId} : {})},
    })
  },
  notificationDuration: () => configProviderStore.state.notificationConfig.duration,
})

</script>

<template>
  <div>
    <home-layout/>
    <ImCallWindow />
  </div>
</template>
