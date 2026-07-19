<script setup lang="ts">
import {ref} from 'vue'
import {BubbleList as AxBubbleList, Welcome as AxWelcome} from '@antdv-next/x'
import type {BubbleListRef, RoleType} from '@antdv-next/x/dist/bubble/interface'
import {XMarkdown} from '@antdv-next/x-markdown'
import '@antdv-next/x-markdown/themes/index.css'
import '@antdv-next/x-markdown/themes/light.css'
import {CHAT_BUBBLE_TYPE} from '@/constants/messageConstant.ts'
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import type {
  AgentChatRequestBody,
  AgentChatResponseBody,
  AgentSenderFormProps
} from "@/types/composables";
import LAgentSender from "@/components/ai-server/agent/AgentSender.vue";
import useApp from "antdv-next/dist/app/useApp";
import {useAgentChatContext} from "@/composables";
import {DEFAULT_PAGE_RESULT_VALUE} from "@/constants/systemConstant.ts";
import type {RestResult} from "@/types/apis";
import {AgentService} from "@/apis";

defineOptions({
  name: 'LAgentView',
})

const props = withDefaults(defineProps<{
  bubbleListRole?: RoleType,
}>(),{
  bubbleListRole:{
    user: {
      variant: 'filled',
      placement: 'end',
      shape: 'corner',
      classes: {content: 'bg-primary-bg!'},
    },
    ai: {
      variant: 'filled',
      placement: 'start',
      shape: 'corner',
    },
  }
})

const agentChatContext = useAgentChatContext()

const principalStore = usePrincipalStore()

const bubbleListRef = ref<BubbleListRef>()
const senderRef = ref<InstanceType<typeof LAgentSender>>()

const {message} = useApp()

function scrollTo(options: {
  key?: string | number
  top?: number | 'bottom' | 'top'
  behavior?: ScrollBehavior
  block?: ScrollLogicalPosition
}): void {
  bubbleListRef.value?.scrollTo(options)
}

function getScrollBox(): HTMLDivElement | undefined {
  return bubbleListRef.value?.scrollBoxNativeElement
}

function toAgentChatRequestBody(value:AgentSenderFormProps):AgentChatRequestBody {
  let agentConversationId = undefined
  let agentWorkspaceId = undefined

  if (agentChatContext.conversationActive) {
    agentConversationId = Number(agentChatContext.conversationActive.value.id)
    agentWorkspaceId = Number(agentChatContext.conversationActive.value.agentWorkspaceId)
  }

  return {
    ...value,
    ...{
      agentConversationId,
      agentWorkspaceId
    }
  }
}

async function onSenderSubmit(value:AgentSenderFormProps) {

  agentChatContext.loading = true
  try {

    const form:AgentChatRequestBody = toAgentChatRequestBody(value)
    const result:RestResult<AgentChatResponseBody> = await AgentService.chat(form)
    if (result.data?.conversation) {
      AgentService.loadStream(Number(result.data?.conversation.id))
      agentChatContext.conversationActive.value = {
        ...result.data?.conversation,
        ...{dataSource:DEFAULT_PAGE_RESULT_VALUE}
      }
      const workspace = agentChatContext.workspaces.value.find(w => w.data.id === result.data?.conversation.agentWorkspaceId)
      if (workspace) {
        const list = workspace.conversations ?? []
        if (list.length === 0) {
          workspace.conversations = [{...result.data?.conversation, dataSource:DEFAULT_PAGE_RESULT_VALUE}]
        }
      }
      if (result.data?.userMessageId) {
        agentChatContext.conversationActive.value?.dataSource?.elements.push({
          key: String(result.data.userMessageId),
          role:CHAT_BUBBLE_TYPE.USER,
          content: value.content
        })
      }
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : String(error))
  } finally {
    agentChatContext.loading = false
  }
}

defineExpose({
  scrollTo,
  getScrollBox,
  getSenderSlotConfigValue: () => senderRef?.value?.getSlotConfigValue() || [],
})

</script>

<template>
  <a-flex
    vertical
    flex="1"
    class="h-full min-h-0 overflow-hidden"
  >
    <a-flex class="h-full min-h-0 overflow-hidden relative flex-[1_1_0]">
      <template v-if="agentChatContext.conversationActive && (agentChatContext.conversationActive.dataSource?.elements || []).length > 0 ">
        <ax-bubble-list
          ref="bubbleListRef"
          class="min-h-0 h-full flex"
          :classes="{ scroll: 'pl-xs pr-xs' }"
          :items="agentChatContext.conversationActive.dataSource.elements || []"
          :role="props.bubbleListRole"
        >
          <template #avatar="{ item }">
            <l-user-avatar
              size="large"
              v-if="item.role === CHAT_BUBBLE_TYPE.USER"
              :user="principalStore.state.details.metadata"
            />
            <a-avatar v-else>
              <icon-font type="icon-xiaojiage-a" />
            </a-avatar>
          </template>
          <template #contentRender="{ item, content }">
            <x-markdown
              v-if="item.role === CHAT_BUBBLE_TYPE.AI && typeof content === 'string'"
              :content="content"
              open-links-in-new-tab
              escape-raw-html
            />
            <template v-else>
              {{ content }}
            </template>
          </template>
        </ax-bubble-list>
        <slot name="bubbleListAfter" />
      </template>
      <a-flex justify="center" align="center" class="size-full">
        <ax-welcome
          variant="borderless"
          title="你好，我是 Captain.J"
          description="今天有什么需要干的吗？"
        >
          <template #icon>
            <icon-font class="text-5xl" type="icon-xiaojiage-a" />
          </template>
        </ax-welcome>
      </a-flex>
    </a-flex>
    <div class="shrink-0 p-sm border-t border-t-border-secondary">
      <l-agent-sender ref="senderRef" @submit="onSenderSubmit" />
    </div>
  </a-flex>
</template>
