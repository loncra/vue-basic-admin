<script setup lang="ts">
import {Conversations as AxConversations} from '@antdv-next/x'
import type {ConversationItemType} from '@antdv-next/x/dist/conversations/interface'
import {useAgentConversation} from '@/composables/ai-server/agent/useAgentConversation.ts'
import {getEnumValue} from "@/utils";

defineOptions({
  name: 'LAgentConversation',
})

const {
  items,
  state,
  menuConfig,
  isWorkspaceDraft,
  startCreateWorkspace,
  cancelCreateWorkspace,
  confirmCreateWorkspace,
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
        {{ $t('agent.creation') }}
      </a-button>
    </a-flex>

    <a-divider plain orientation="left" class="m-0">
      <a-space>
        <icon-font type="loncra-folder" />
        <span>{{ $t('agent.workspace.title') }}</span>
        <a-space-compact>
          <a-button size="small" type="text" @click="startCreateWorkspace">
            <icon-font type="loncra-plus" />
          </a-button>
        </a-space-compact>
      </a-space>
    </a-divider>

    <a-spin :spinning="state.workspace.loading" class="size-full-spin">
      <ax-conversations
        class="min-h-0 size-full flex-[1_1_0]"
        :menu="menuConfig"
        groupable
        :items="items"
      >
        <template #iconRender="{ item, active }">
          <a-space  v-if="item.data">
            <icon-font
              type="loncra-panel-right-close"
              class="text-text-secondary transition-transform duration-300 ease-in-out"
              :class="{ 'rotate-90': active }"
            />
            <icon-font
              v-if="getEnumValue(item.data.operateCategory) === 10"
              type="loncra-folder-cog"
              class="text-primary"
            />
            <icon-font
              v-else
              type="loncra-folder-closed"
              class="text-success"
            />
          </a-space>
        </template>
        <template #labelRender="{ item }">
          <a-space-compact
            v-if="isWorkspaceDraft(item as ConversationItemType)"
            class="w-full"
            @click.stop
            @mousedown.stop
          >
            <a-input
              v-model:value="state.workspace.draftName"
              :placeholder="$t('agent.workspace.createPlaceholder')"
              :disabled="state.workspace.loading"
              @pressEnter="confirmCreateWorkspace"
            />
            <a-button type="primary" :loading="state.workspace.loading" @click="confirmCreateWorkspace">
              <template #icon>
                <icon-font type="loncra-check" />
              </template>
            </a-button>
            <a-button type="primary" danger :disabled="state.workspace.loading" @click="cancelCreateWorkspace">
              <template #icon>
                <icon-font type="loncra-x" />
              </template>
            </a-button>
          </a-space-compact>
          <template v-else>
            {{ item.label }}
          </template>
        </template>
      </ax-conversations>

    </a-spin>
  </a-flex>
</template>
