<script setup lang="ts">
import {Conversations as AxConversations} from '@antdv-next/x'
import type {ConversationItemType} from '@antdv-next/x/dist/conversations/interface'
import {useAgentConversation} from '@/composables/ai-server/agent/useAgentConversation.ts'
import {getEnumValue} from '@/utils'
import {DEFAULT_OPERATE_CATEGORY} from '@/constants/systemConstant.ts'

defineOptions({
  name: 'LAgentConversation',
})

const {
  items,
  loading,
  menuConfig,
  startCreateWorkspace,
  cancelEditWorkspace,
  confirmEditWorkspace,
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

    <a-spin :spinning="loading" class="size-full-spin">
      <ax-conversations
        class="min-h-0 size-full flex-[1_1_0]"
        :menu="menuConfig"
        groupable
        :items="items"
      >
        <template #iconRender="{ item, active }">
          <a-space v-if="item.data && item.editing === false">
            <icon-font
              type="loncra-panel-right-close"
              class="text-text-secondary transition-transform duration-300 ease-in-out"
              :class="{ 'rotate-90': active }"
            />
            <icon-font
              v-if="getEnumValue(item.data.operateCategory) === DEFAULT_OPERATE_CATEGORY.SYSTEM"
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
            v-if="(item as ConversationItemType & { editing?: boolean }).editing"
            class="w-full"
            @click.stop
            @mousedown.stop
          >
            <a-input
              v-model:value="(item as ConversationItemType).label"
              :placeholder="$t('agent.workspace.createPlaceholder')"
              :disabled="loading"
              @pressEnter="confirmEditWorkspace(item as ConversationItemType & { editing?: boolean })"
            />
            <a-button
              type="primary"
              :loading="loading"
              @click="confirmEditWorkspace(item as ConversationItemType & { editing?: boolean })"
            >
              <template #icon>
                <icon-font type="loncra-check" />
              </template>
            </a-button>
            <a-button
              type="primary"
              danger
              :disabled="loading"
              @click="cancelEditWorkspace(item as ConversationItemType & { editing?: boolean })"
            >
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
