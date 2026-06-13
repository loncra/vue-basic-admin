<script setup lang="ts">

import {getEnumName, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {AuthServerService} from "@/apis";
import {ChatMessageService} from "@/apis/message-server/chatMessageService.ts";
import type {UserChatMessageResponseBody} from "@/types/apis";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {type ComponentInternalInstance, getCurrentInstance} from "vue";

defineOptions({
  name: 'LChatMessageReference',
})

const principalStore = usePrincipalStore()
const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const props = withDefaults(defineProps<{
  message:UserChatMessageResponseBody
}>(),{

})

const emit = defineEmits<{
  click: [message: UserChatMessageResponseBody]
}>()

</script>

<template>
  <a-tag v-bind="$attrs" :color="getEnumValue(props.message.participant.type) !== 30 ? 'gold' : 'green'">
    <a-space>
      <template v-if="getEnumValue(props.message.participant.type) !== 30">
        [{{getEnumName(props.message.participant.type)}}]
      </template>
      <template v-if="principalStore.state.name === props.message.principal">
        {{ globalProperties.$t('common.me') }}
      </template>
      <template v-else>
        {{ AuthServerService.getPrincipalNameByPlatformUser(props.message.participant.metadata.details) }}
      </template>
      :
      <a-typography-text type="secondary" @click="emit('click', props.message)" class="w-50 cursor-pointer" ellipsis>
        {{ ChatMessageService.getMessageContent(props.message)}}
      </a-typography-text>
    </a-space>
  </a-tag>
</template>
