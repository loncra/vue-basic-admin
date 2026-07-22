<script setup lang="ts">

import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import LAgentConversation from "@/components/ai-server/agent/AgentConversation.vue";
import LAgentView from "@/components/ai-server/agent/AgentView.vue";
import {provideAgentChatContext} from "@/composables";
import {getEnumValue} from "@/utils";
import {AGENT_CONVERSATION_TYPE} from "@/constants";
import type {ActiveAgentConversationItem} from "@/types/composables";
import {ref} from "vue";

defineOptions({
  name: 'CommonAiAgent',
})

const agentViewRef = ref<InstanceType<typeof LAgentView>>()

const {conversationActive} = provideAgentChatContext({
  view:agentViewRef
})

function onSenderSubmit(body: ActiveAgentConversationItem) {
  console.log('onSenderSubmit', body)
}

</script>

<template>
  <div class="h-full min-h-0">
    <l-menu-title-card
      :classes="{
        root:'min-h-0 flex flex-col h-full shadow-ter',
        header: 'shrink-0',
        body:'flex flex-1 min-h-120 p-0! overflow-hidden'
      }"
    >
      <template #extra v-if="conversationActive && getEnumValue(conversationActive.type) === AGENT_CONVERSATION_TYPE.WORKSPACE_CONVERSATION">
        {{conversationActive?.name}}
      </template>
      <div class="min-h-0 size-full overflow-hidden">
        <a-splitter class="ai-agent-splitter h-full min-h-0">
          <a-splitter-panel
            class="h-full p-0 overflow-hidden"
            default-size="20%"
            min="15%"
            max="25%"
            :collapsible="{ end: true }"
          >
            <l-agent-conversation />
          </a-splitter-panel>
          <a-splitter-panel
            class="h-full min-h-0 overflow-hidden"
          >
            <l-agent-view
              ref="agentViewRef"
              @sender-submit="onSenderSubmit"
            />
          </a-splitter-panel>
        </a-splitter>
      </div>
    </l-menu-title-card>
  </div>
</template>
