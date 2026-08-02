<script setup lang="ts">
import type {
  AgentAnswerBlock,
  AgentChatBasicResponseBody,
  AgentErrorBlock,
  AgentSseMessageContent,
  AgentThinkBlock,
  AgentToolCallBlock,
  BlockRunningContentMetadata,
} from '@/types/composables'
import type {ThoughtChainItemType} from "@antdv-next/x"
import {
  Bubble as AxBubble,
  Sources as AxSources,
  Think as AxThink,
  ThoughtChain as AxThoughtChain
} from "@antdv-next/x"
import {
  AGENT_BLOCK_STATUS,
  AGENT_CONTENT_TYPE,
  AGENT_TOOL_BLOCK_STATUS,
  TOOL_RUNNING_STATUS_VALUE
} from "@/constants"
import LMarkdownCodeRenderer from "@/components/basic/markdown/MarkdownCodeRenderer.vue"
import {getEnumValue} from "@/utils"
import LMarkdown from "@/components/basic/markdown/Markdown.vue"

import {RightOutlined,} from '@antdv-next/icons'

import {computed, reactive} from 'vue'
import {AgentService} from "@/apis";
import type {RestResult} from "@/types/apis";

defineOptions({
  name: 'LAgentAssistantBubbleContent',
})

const props = defineProps<{
  assistantMessageId:number
}>()

const model = defineModel<AgentSseMessageContent[]>("content", {default:() => []})

const emits = defineEmits<{
  resume: [value: AgentChatBasicResponseBody]
}>()

// ---- 按 groupId 分组 ----
interface BlockGroup {
  groupId: string
  thinkBlock?: AgentThinkBlock
  answerBlock?: AgentAnswerBlock
  toolBlocks: AgentToolCallBlock[]
  errorBlock?: AgentErrorBlock
}

interface ThoughtChainItemDataType extends ThoughtChainItemType {
  data: AgentToolCallBlock
}

function hasConfirmed(tools:AgentToolCallBlock[]) {
  return tools.filter(s => s.hitlStatus === AGENT_TOOL_BLOCK_STATUS.PENDING)
    .filter(s => s.userConfirmed === undefined)
    .length > 0
}

function getTavilySearchSourceConfig(json:string) {
  if (!json) {
    return
  }
  const object = JSON.parse(json)
  return {
    title: object.query,
    items:object.results.map((item: { title: string; content: string; favicon: string; url: string }) => ({
      title: item.title,
      content: item.content,
      favicon: item.favicon,
      url: item.url,
    }))
  }
}

async function clickHitl(tool:AgentToolCallBlock, confirmed:boolean) {
  const find = model.value.find(c => c.id === tool.id)
  if (!find) {
    return
  }
  const findTool = find as AgentToolCallBlock
  if (findTool.hitlStatus !== AGENT_TOOL_BLOCK_STATUS.PENDING) {
    return
  }

  findTool.userConfirmed = confirmed

  const tools = model.value
    .filter(s => s.type === AGENT_CONTENT_TYPE.TOOL)
    .map(s => s as AgentToolCallBlock)
  if (!hasConfirmed(tools)) {
    const confirmResults = model.value
      .filter(s => s.type === AGENT_CONTENT_TYPE.TOOL)
      .filter(s => (s as AgentToolCallBlock).hitlStatus === AGENT_TOOL_BLOCK_STATUS.PENDING)
      .map(s => ({
        toolCallId: (s as AgentToolCallBlock).id,
        confirmed: (s as AgentToolCallBlock).userConfirmed || false,
      }))
    const result:RestResult<AgentChatBasicResponseBody> = await AgentService.resume({assistantMessageId:props.assistantMessageId, confirmResults})
    if (result.data) {
      emits("resume", result.data)
    }
  }
}

const groupedBlocks = computed<BlockGroup[]>(() => {
  const groupMap = new Map<string, BlockGroup>()
  const orderedKeys: string[] = []

  function ensureGroup(key: string): BlockGroup {
    if (!groupMap.has(key)) {
      groupMap.set(key, { groupId: key, toolBlocks: [] })
      orderedKeys.push(key)
    }
    return groupMap.get(key)!
  }

  for (const block of model.value) {
    const type = getEnumValue(block.type)

    if (type === AGENT_CONTENT_TYPE.THINK) {
      ensureGroup(block.id).thinkBlock = block as AgentThinkBlock
    } else if (type === AGENT_CONTENT_TYPE.ANSWER) {
      ensureGroup(block.id).answerBlock = block as AgentAnswerBlock
    } else if (type === AGENT_CONTENT_TYPE.TOOL) {
      const toolBlock = block as AgentToolCallBlock
      ensureGroup(toolBlock.groupId || toolBlock.id).toolBlocks.push(toolBlock)
    } else if (type === AGENT_CONTENT_TYPE.ERROR) {
      ensureGroup(block.id).errorBlock = block as AgentErrorBlock
    }
  }

  return orderedKeys.map(k => groupMap.get(k)!)
})

// ---- 工具调用卡片：运行中自动展开 / 用户手动后不再自动干预 ----

/** 用户手动设置的展开状态：undefined=未操作, true=展开, false=收起 */
const toolCallUserState = reactive<Record<string, boolean | undefined>>({})

/** 实际展开状态（computed 派生，零副作用）：
 *  有 RUNNING 工具 → 自动展开
 *  用户手动操作过 → 尊重用户选择
 *  全部完成且未操作 → 自动收起
 */
const toolCallExpandedState = computed<Record<string, boolean>>(() => {
  const result: Record<string, boolean> = {}
  for (const group of groupedBlocks.value) {
    const uid = toolCallUserState[group.groupId]
    if (uid !== undefined) {
      result[group.groupId] = uid
    } else {
      result[group.groupId] = group.toolBlocks
        .some(b => TOOL_RUNNING_STATUS_VALUE.includes(getEnumValue(b.status)))
    }
  }
  return result
})

function toggleToolCallExpanded(groupId: string) {
  toolCallUserState[groupId] = !toolCallExpandedState.value[groupId]
}

/** TOOL 状态 → ThoughtChainItemType.status */
function toolChainStatus(block: AgentToolCallBlock): ThoughtChainItemType['status'] {
  const status = getEnumValue(block.status)
  if (status === AGENT_BLOCK_STATUS.RUNNING) return 'loading'
  if (block.resultState === 'error' || status === AGENT_BLOCK_STATUS.FAILED) return 'error'
  if (block.resultState === 'success') return 'success'
  return undefined
}

/** TOOL → ThoughtChain item */
function toThoughtChainItem(block: AgentToolCallBlock): ThoughtChainItemDataType {
  const running = getEnumValue(block.status) === AGENT_BLOCK_STATUS.RUNNING
  return {
    key: block.id,
    title: block.name,
    description: block.value,
    content: block.outputText,
    data: block,
    status: toolChainStatus(block),
    blink: running,
    collapsible: true,
  }
}

/** 是否正在运行（THINK / ANSWER 共用） */
function isRunning(block: BlockRunningContentMetadata): boolean {
  return getEnumValue(block.status) === AGENT_BLOCK_STATUS.RUNNING
}
</script>

<template>
  <a-flex vertical gap="small" v-if="model.length > 0">
    <template v-for="group of groupedBlocks" :key="group.groupId">

      <!-- 思考 -->
      <a-card v-if="group.thinkBlock" :classes="{ body: 'p-xs' }">
        <ax-think
          :classes="{ content: 'ml-xxs' }"
          :title="$t('agent.think')"
          :default-expanded="false"
          v-model:expanded="group.thinkBlock.expanded"
          :blink="isRunning(group.thinkBlock)"
          :loading="isRunning(group.thinkBlock)"
        >
          <l-markdown
            :content="group.thinkBlock.value!"
            :components="{ code: LMarkdownCodeRenderer }"
            paragraph-tag="div"
            :streaming="{ hasNextChunk: isRunning(group.thinkBlock) }"
            open-links-in-new-tab
          />
        </ax-think>
      </a-card>

      <!-- 回答 -->
      <ax-bubble v-if="group.answerBlock" class="p-0!" content=" ">
        <template #content>
          <l-markdown
            :content="group.answerBlock.value!"
            :components="{ code: LMarkdownCodeRenderer }"
            paragraph-tag="div"
            :streaming="{ hasNextChunk: isRunning(group.answerBlock) }"
            open-links-in-new-tab
          />
        </template>
      </ax-bubble>

      <!-- 工具调用 → 思维链 -->
      <a-card
        class="l-agent-bubble-content-tool-call-card"
        v-if="group.toolBlocks.length > 0"
        size="small"
        :classes="{ body: '!p-0' }"
      >
        <template #title>
          <a-space>
            <icon-font type="loncra-square-terminal" />
            <span>
              {{$t('agent.toolCall.text')}}
            </span>
            <RightOutlined
              v-if="!hasConfirmed(group.toolBlocks)"
              class="text-xs text-text-quaternary cursor-pointer transition-transform duration-300"
              :class="{ 'rotate-90': toolCallExpandedState[group.groupId] }"
              @click.stop="toggleToolCallExpanded(group.groupId)"
            />
          </a-space>
        </template>
        <Transition name="tool-call-expand">
          <div class="p-sm" v-if="toolCallExpandedState[group.groupId]" key="expanded">
            <ax-thought-chain
              :items="group.toolBlocks.map(toThoughtChainItem)"
            >
              <template #content="{ item }">
                <ax-sources
                  class="l-web-search-sources"
                  v-if="item.title === 'tavily_search' && item.data?.outputText"
                  expand-icon-position="end"
                  v-bind="getTavilySearchSourceConfig(item.data?.outputText)"
                >
                  <template #iconRender="{item}">
                    <a-avatar size="small" :src="item.favicon" />
                  </template>
                </ax-sources>
                <span v-else>
                  {{item.data?.outputText || ''}}
                </span>
              </template>
              <template #footer="{ item }">
                <a-space v-if="item.data.hitlStatus === AGENT_TOOL_BLOCK_STATUS.PENDING && item.data.userConfirmed === undefined">
                  <a-button type="primary" @click="clickHitl(item.data as AgentToolCallBlock, true)">
                    <template #icon>
                      <icon-font type="loncra-clipboard-check" />
                    </template>
                    {{$t('agent.toolCall.hitl.confirm')}}
                  </a-button>
                  <a-button @click="clickHitl(item.data as AgentToolCallBlock, false)">
                    <template #icon>
                      <icon-font type="loncra-clipboard-x" />
                    </template>
                    {{$t('agent.toolCall.hitl.cancel')}}
                  </a-button>
                </a-space>
              </template>
            </ax-thought-chain>
          </div>
        </Transition>
      </a-card>

      <!-- 错误 -->
      <a-alert
        v-if="group.errorBlock"
        type="error"
        show-icon
        :message="group.errorBlock.metadata.message"
      />
    </template>
  </a-flex>

  <!-- 空内容 → loading dots -->
  <span v-else class="antd-bubble-dot">
    <i class="antd-bubble-dot-item" />
    <i class="antd-bubble-dot-item" />
    <i class="antd-bubble-dot-item" />
  </span>
</template>
