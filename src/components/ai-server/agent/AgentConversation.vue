<script setup lang="ts">
import {useAgentConversation} from '@/composables/ai-server/agent/useAgentConversation.ts'
import {getEnumValue, requireNonNullOrUndefined} from '@/utils'
import {AGENT_CONVERSATION_TYPE} from "@/constants";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {type ComponentInternalInstance, getCurrentInstance} from "vue";

defineOptions({
  name: 'LAgentConversation',
})

const configProviderStore = useConfigProviderStore()

const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
  getCurrentInstance(),
).appContext.config.globalProperties

const {
  conversations,
  loading,
  createMenu,
  getAgentChatStatusStyle,
  startCreateWorkspace,
  cancelEditWorkspace,
  confirmEditWorkspace,
  onConversationMenuClick,
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
          <icon-font type="loncra-plus"/>
        </template>
        {{ $t('agent.creation') }}
      </a-button>
    </a-flex>

    <a-divider plain orientation="left" class="m-0">
      <a-space>
        <icon-font type="loncra-folder"/>
        <span>{{ $t('agent.workspace.title') }}</span>
        <a-space-compact>
          <a-button size="small" type="text" @click="startCreateWorkspace">
            <icon-font type="loncra-plus"/>
          </a-button>
        </a-space-compact>
      </a-space>
    </a-divider>

    <a-spin :spinning="loading" class="size-full-spin">
      <a-menu
        root-class="border-none agent-side-menu"
        :items="conversations"
        :inline-indent="configProviderStore.getToken().size"
        mode="inline"
      >
        <template #iconRender="item">
          <template v-if="!item.editing">
            <icon-font
              v-if="getEnumValue(item.type) === AGENT_CONVERSATION_TYPE.DEFAULT_WORKSPACE"
              type="loncra-folder-cog"
              class="text-primary"
            />
            <icon-font
              v-else-if="getEnumValue(item.type) === AGENT_CONVERSATION_TYPE.CUSTOMIZE_WORKSPACE"
              type="loncra-folder-closed"
              class="text-success"
            />
            <icon-font
              v-else-if="getEnumValue(item.type) === AGENT_CONVERSATION_TYPE.WORKSPACE_CONVERSATION"
              :type="getAgentChatStatusStyle(item.status).icon"
              :class="getAgentChatStatusStyle(item.status).textClass"
              :spin="getAgentChatStatusStyle(item.status).spin"
            />
          </template>
        </template>

        <template #labelRender="item">
          <a-space-compact
            v-if="item.editing"
            class="w-full"
            @click.stop
            @mousedown.stop
          >
            <a-input
              v-model:value="item.name"
              :placeholder="$t('agent.workspace.createPlaceholder')"
              :disabled="loading"
              @pressEnter="confirmEditWorkspace(item)"
            />
            <a-button
              type="primary"
              :loading="loading"
              @click="confirmEditWorkspace(item)"
            >
              <template #icon>
                <icon-font type="loncra-check"/>
              </template>
            </a-button>
            <a-button
              type="primary"
              danger
              :disabled="loading"
              @click="cancelEditWorkspace(item)"
            >
              <template #icon>
                <icon-font type="loncra-x"/>
              </template>
            </a-button>
          </a-space-compact>
          <a-flex
            v-else
            class="group min-w-0 w-full"
            justify="space-between"
            align="center"
            @click="() => onConversationMenuClick(item)"
          >
            <a-typography-text
              class="min-w-0 flex-1"
              :ellipsis="{ tooltip: item.name }"
            >
              {{ item.name }}
            </a-typography-text>
            <span class="relative inline-flex shrink-0 items-center justify-end">
              <a-typography-text
                v-if="getEnumValue(item.type) === AGENT_CONVERSATION_TYPE.WORKSPACE_CONVERSATION"
                type="secondary"
                class="whitespace-nowrap text-sm transition-opacity duration-300 opacity-100 group-hover:absolute group-hover:opacity-0 group-hover:pointer-events-none"
              >
                {{ globalProperties.$dayjs(item.creationTime).fromNow() }}
              </a-typography-text>
              <a-dropdown
                v-if="getEnumValue(item.type) !== AGENT_CONVERSATION_TYPE.DEFAULT_WORKSPACE"
                :menu="createMenu(item)"
              >
                <a-button
                  type="text"
                  size="small"
                  class="absolute opacity-0 transition-opacity duration-300 group-hover:static group-hover:opacity-100"
                  @click.stop
                  @mousedown.stop
                >
                  <template #icon>
                    <icon-font type="loncra-ellipsis"/>
                  </template>
                </a-button>
              </a-dropdown>
            </span>
          </a-flex>
        </template>
      </a-menu>

    </a-spin>
  </a-flex>
</template>
