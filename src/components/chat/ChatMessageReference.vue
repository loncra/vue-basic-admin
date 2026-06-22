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
  <a-tag
    @click="emit('click', props.message)"
    class="cursor-pointer max-w-80 flex flex-inline"
    v-bind="$attrs"
    :color="getEnumValue(props.message.participant.type) !== 30 ? 'gold' : undefined"
  >
    <a-flex class="flex-inline">
      <a-typography-text class="flex flex-inline shrink-0">
        <template v-if="getEnumValue(props.message.participant.type) !== 30">
          [{{getEnumName(props.message.participant.type)}}]
        </template>
        <template v-if="principalStore.state.name === props.message.principal">
          {{ globalProperties.$t('common.me') }}
        </template>
        <template v-else>
          [{{ AuthServerService.getPrincipalNameByUserDetails(props.message.participant.metadata.details) }}]
        </template>
        : 
      </a-typography-text>
      <a-typography-text class="min-w-0 w-full flex flex-inline flex-1" type="secondary" ellipsis>
        {{ ChatMessageService.getMessageContent(props.message)}}
      </a-typography-text>
    </a-flex>
  </a-tag>
</template>
