<script setup lang="ts">

import {Conversations as AxConversations,} from '@antdv-next/x'
import {useAgentConversation} from "@/composables/message-server/agent/useAgentConversation.ts";

defineOptions({
  name: 'LAgentConversation',
})

const {
} = useAgentConversation()

</script>

<template>
  <a-flex
    vertical
    class="h-full min-h-0 overflow-hidden"
  >
    <a-flex
      vertical
      class="p-md"
    >

      <a-button block type="primary">
        <template #icon>
          <icon-font type="loncra-plus" />
        </template>
        {{$t('agent.creation')}}
      </a-button>
    </a-flex>

    <a-divider class="m-0" plain orientation="left">
      <a-space>
        <icon-font type="loncra-folder" />
        <span>{{$t('agent.workspace')}}</span>
      </a-space>
    </a-divider>
    <ax-conversations
      class="min-h-0 size-full flex-[1_1_0]"
      groupable
    >

    </ax-conversations>

  </a-flex>

</template>
