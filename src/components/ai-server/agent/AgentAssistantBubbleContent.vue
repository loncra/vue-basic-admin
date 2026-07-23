<script setup lang="ts">
import {computed} from 'vue'
import {ThoughtChain as AxThoughtChain} from '@antdv-next/x'
import type {ThoughtChainItemType} from '@antdv-next/x/dist/thought-chain/interface'
import {XMarkdown} from '@antdv-next/x-markdown'
import '@antdv-next/x-markdown/themes/index.css'
import '@antdv-next/x-markdown/themes/light.css'
import {AGENT_CONTENT_TYPE, AGENT_TOOL_BLOCK_STATUS,} from '@/constants'
import type {
  AgentAnswerBlock,
  AgentErrorBlock,
  AgentThinkBlock,
  AgentToolBlock,
  ChatContentBlock,
} from '@/types/composables'

defineOptions({
  name: 'LAgentAssistantBubbleContent',
})

const props = defineProps<{
  content?: ChatContentBlock[] | ChatContentBlock | string
}>()

const blocks = computed(() => {
  const raw = props.content
  if (!raw) {
    return [] as ChatContentBlock[]
  }
  if (typeof raw === 'string') {
    return [
      {
        type: AGENT_CONTENT_TYPE.ANSWER,
        id: 'answer',
        value: raw,
      } satisfies AgentAnswerBlock,
    ]
  }
  return Array.isArray(raw) ? raw : [raw]
})

const thoughtItems = computed<ThoughtChainItemType[]>(() => {
  const items: ThoughtChainItemType[] = []
  for (const block of blocks.value) {
    if (block.type === AGENT_CONTENT_TYPE.THINK) {
      const think = block as AgentThinkBlock
      items.push({
        key: think.id || `think-${items.length}`,
        title: '思考',
        content: think.value || '',
        status: think.value ? 'success' : 'loading',
        collapsible: true,
      })
      continue
    }
    if (block.type === AGENT_CONTENT_TYPE.TOOL) {
      const tool = block as AgentToolBlock
      items.push({
        key: tool.id || `tool-${items.length}`,
        title: tool.name || '工具调用',
        description: tool.status,
        content: formatToolContent(tool),
        status: mapToolStatus(tool.status),
        collapsible: true,
      })
    }
  }
  return items
})

const answerText = computed(() => {
  const answer = blocks.value.find((b) => b.type === AGENT_CONTENT_TYPE.ANSWER) as
    | AgentAnswerBlock
    | undefined
  return answer?.value || ''
})

const errorText = computed(() => {
  const error = blocks.value.find((b) => b.type === AGENT_CONTENT_TYPE.ERROR) as
    | AgentErrorBlock
    | undefined
  return error?.value || ''
})

function mapToolStatus(status?: string): ThoughtChainItemType['status'] {
  if (status === AGENT_TOOL_BLOCK_STATUS.DONE) {
    return 'success'
  }
  if (status === AGENT_TOOL_BLOCK_STATUS.FAILED) {
    return 'error'
  }
  return 'loading'
}

function formatToolContent(tool: AgentToolBlock): string {
  const parts: string[] = []
  if (tool.input !== undefined && tool.input !== null) {
    parts.push(`输入：${stringify(tool.input)}`)
  }
  if (tool.output !== undefined && tool.output !== null) {
    parts.push(`输出：${stringify(tool.output)}`)
  }
  return parts.join('\n')
}

function stringify(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}
</script>

<template>
  <a-flex vertical gap="small" class="w-full min-w-0">
    <ax-thought-chain v-if="thoughtItems.length > 0" :items="thoughtItems" line="dashed" />
    <x-markdown
      v-if="answerText"
      :content="answerText"
      open-links-in-new-tab
      escape-raw-html
    />
    <a-alert v-if="errorText" type="error" show-icon :message="errorText" />
    <a-spin v-if="!answerText && !errorText && thoughtItems.length === 0" size="small" />
  </a-flex>
</template>
