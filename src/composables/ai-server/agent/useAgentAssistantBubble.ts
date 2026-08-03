import type {
  AgentAnswerBlock,
  AgentChatBasicResponseBody,
  AgentErrorBlock,
  AgentSseMessageContent,
  AgentThinkBlock,
  AgentToolCallBlock,
  BlockGroup,
  BlockRunningContentMetadata,
  ChatBubbleItem,
  ThoughtChainItemDataType
} from "@/types/composables";
import {getEnumValue} from "@/utils";
import {
  AGENT_BLOCK_STATUS,
  AGENT_CONTENT_TYPE,
  AGENT_TOOL_BLOCK_STATUS,
  RUNNING_STATUS_VALUE
} from "@/constants";
import {computed, reactive} from "vue";
import type {ThoughtChainItemType} from "@antdv-next/x";
import type {RestResult} from "@/types/apis";
import {AgentService} from "@/apis";

/** 是否正在运行（THINK / ANSWER / TOOL 共用） */
export function isBlockRunning(block: BlockRunningContentMetadata): boolean {
  return RUNNING_STATUS_VALUE.includes(getEnumValue(block.status))
}

export function getTavilySearchSourceConfig(json:string) {
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

export function hasToolConfirmed(tools:AgentToolCallBlock[]) {
  return tools.filter(s => s.hitlStatus === AGENT_TOOL_BLOCK_STATUS.PENDING)
    .filter(s => s.userConfirmed === undefined)
    .length > 0
}

/** TOOL 状态 → ThoughtChainItemType.status */
export function getToolChainStatus(block: AgentToolCallBlock): ThoughtChainItemType['status'] {
  const status = getEnumValue(block.status)
  if (status === AGENT_BLOCK_STATUS.RUNNING) {
    return 'loading'
  }
  if (block.resultState === 'error' || status === AGENT_BLOCK_STATUS.FAILED) {
    return 'error'
  }
  if (block.resultState === 'success') {
    return 'success'
  }
  return undefined
}

export function useAgentAssistantBubble(
  item:ChatBubbleItem
) {
  /** 用户手动设置的展开状态：undefined=未操作, true=展开, false=收起 */
  const toolCallUserState = reactive<Record<string, boolean | undefined>>({})

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

    for (const block of item.content as AgentSseMessageContent[]) {
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
          .some(b => RUNNING_STATUS_VALUE.includes(getEnumValue(b.status)))
      }
    }
    return result
  })

  function toggleToolCallExpanded(groupId: string) {
    toolCallUserState[groupId] = !toolCallExpandedState.value[groupId]
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
      status: getToolChainStatus(block),
      blink: running,
      collapsible: true,
    }
  }

  async function clickToolConfirmed(tool:AgentToolCallBlock, confirmed:boolean) {
    const contents = item.content as AgentSseMessageContent[]
    const find = contents.find(c => c.id === tool.id)
    if (!find) {
      return
    }
    const findTool = find as AgentToolCallBlock
    if (findTool.hitlStatus !== AGENT_TOOL_BLOCK_STATUS.PENDING) {
      return
    }

    findTool.userConfirmed = confirmed

    const tools = contents
      .filter(s => s.type === AGENT_CONTENT_TYPE.TOOL)
      .map(s => s as AgentToolCallBlock)
    if (!hasToolConfirmed(tools)) {
      const confirmResults = contents
        .filter(s => s.type === AGENT_CONTENT_TYPE.TOOL)
        .filter(s => (s as AgentToolCallBlock).hitlStatus === AGENT_TOOL_BLOCK_STATUS.PENDING)
        .map(s => ({
          toolCallId: (s as AgentToolCallBlock).id,
          confirmed: (s as AgentToolCallBlock).userConfirmed || false,
        }))
      const result:RestResult<AgentChatBasicResponseBody> = await AgentService.resume({assistantMessageId:Number(item.key), confirmResults})
      if (result.data) {
        //emits("resume", result.data)
      }
    }
  }

  function hasContent() {
    const contents = item.content as AgentSseMessageContent[]
    return contents.length > 0
  }

  return {
    clickToolConfirmed,
    toolCallExpandedState,
    groupedBlocks,
    hasContent,
    toThoughtChainItem,
    toggleToolCallExpanded
  }
}
