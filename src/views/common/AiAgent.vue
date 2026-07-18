<script setup lang="ts">

import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import LAgentConversation from "@/components/ai-server/agent/AgentConversation.vue";
import LAgentView from "@/components/ai-server/agent/AgentView.vue";

defineOptions({
  name: 'CommonAiAgent',
})

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
            <l-agent-view />
          </a-splitter-panel>
        </a-splitter>
      </div>
    </l-menu-title-card>
  </div>
</template>
