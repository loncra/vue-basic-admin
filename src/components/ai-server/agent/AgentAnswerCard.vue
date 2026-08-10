<script setup lang="ts">
import {computed, onMounted, provide, ref, watch} from 'vue'
import type {ActionPayload} from '@antdv-next/x-card'
import {XCardBox, XCardCard} from '@antdv-next/x-card'
import type {AgentAnswerBlock} from '@/types/composables'
import {
  AGENT_ANSWER_FORMAT,
  AGENT_CLARIFY_ACTION,
  AGENT_CLARIFY_TOOL,
  AGENT_PLAN_TOOL,
} from '@/constants'
import {AgentService} from '@/apis'
import {useAgentChatContext} from '@/composables'
import {
  AGENT_XCARD_COMPONENTS,
  XCARD_FORM_STATE_KEY,
} from '@/components/ai-server/agent/xcard/xcardFormComponents.ts'
import LMarkdownCodeRenderer from '@/components/basic/markdown/MarkdownCodeRenderer.vue'
import LMarkdown from '@/components/basic/markdown/Markdown.vue'
import {isBlockRunning} from '@/composables'
import useApp from 'antdv-next/dist/app/useApp'
import type {ChatBubbleItem} from '@/types/composables'
import type {AgentToolCallBlock} from '@/types/composables'
import {AGENT_CONTENT_TYPE} from '@/constants'
import {getEnumValue} from '@/utils'
import {flattenClarifyAnswers, isHitlAwaiting} from '@/composables/ai-server/agent/agentHitl.ts'

defineOptions({
  name: 'LAgentAnswerCard',
})

const props = defineProps<{
  answer: AgentAnswerBlock
  assistantMessageId: number
  bubbleItem?: ChatBubbleItem
}>()

const {message} = useApp()
const {stream} = useAgentChatContext()
const submitting = ref(false)
const formState = ref<Record<string, unknown>>({})
provide(XCARD_FORM_STATE_KEY, formState)

const format = computed(() => props.answer.format || AGENT_ANSWER_FORMAT.MARKDOWN)
const isA2ui = computed(() => format.value === AGENT_ANSWER_FORMAT.A2UI)
const surfaceId = computed(() => props.answer.surfaceId || 'clarify-surface')
const commands = computed(() => (props.answer.commands || []) as never[])
const pendingClarify = computed(() => {
  return Boolean(props.answer.hitlToolCallId)
    && props.answer.sourceExit === AGENT_CLARIFY_TOOL.EXIT
    && isExitStillPending()
})
const pendingPlanExit = computed(() => {
  return Boolean(props.answer.hitlToolCallId)
    && props.answer.sourceExit === AGENT_PLAN_TOOL.EXIT
    && isExitStillPending()
})

function isExitStillPending() {
  const contents = (props.bubbleItem?.content || []) as AgentToolCallBlock[]
  const exit = contents.find(c =>
    getEnumValue(c.type) === AGENT_CONTENT_TYPE.TOOL
    && c.id === props.answer.hitlToolCallId,
  )
  if (!exit) {
    return true
  }
  return isHitlAwaiting(exit)
}

watch(
  () => props.answer.commands,
  () => {
    formState.value = {}
  },
  {immediate: true},
)

onMounted(() => console.info(props))

async function onAction(payload: ActionPayload) {
  if (!pendingClarify.value || submitting.value) {
    return
  }
  const name = payload.name
  const isCancel = name === AGENT_CLARIFY_ACTION.CANCEL
  const isSubmit = name === AGENT_CLARIFY_ACTION.SUBMIT
  if (!isCancel && !isSubmit) {
    return
  }
  submitting.value = true
  try {
    const answers = isSubmit
      ? flattenClarifyAnswers({...formState.value, ...(payload.context || {})})
      : undefined
    if (isSubmit && (!answers || Object.keys(answers).length === 0)) {
      message.warning('请先填写澄清表单')
      return
    }
    markExitConfirmed(isSubmit)
    await AgentService.clarifySubmit({
      assistantMessageId: props.assistantMessageId,
      toolCallId: props.answer.hitlToolCallId!,
      ...(answers ? {answers, summary: props.answer.value} : {}),
    })
    stream.connect(props.assistantMessageId, false)
  } catch (error) {
    markExitConfirmed(undefined)
    message.error(error instanceof Error ? error.message : String(error))
  } finally {
    submitting.value = false
  }
}

function markExitConfirmed(confirmed: boolean | undefined) {
  const contents = (props.bubbleItem?.content || []) as AgentToolCallBlock[]
  const exit = contents.find(c => c.id === props.answer.hitlToolCallId)
  if (exit) {
    exit.userConfirmed = confirmed
  }
}

async function confirmPlan(confirmed: boolean) {
  if (!pendingPlanExit.value || submitting.value || !props.answer.hitlToolCallId) {
    return
  }
  submitting.value = true
  try {
    const contents = (props.bubbleItem?.content || []) as AgentToolCallBlock[]
    const exit = contents.find(c => c.id === props.answer.hitlToolCallId)
    if (exit) {
      exit.userConfirmed = confirmed
    }
    await AgentService.resume({
      assistantMessageId: props.assistantMessageId,
      confirmResults: [{toolCallId: props.answer.hitlToolCallId, confirmed}],
    })
    stream.connect(props.assistantMessageId, false)
  } catch (error) {
    message.error(error instanceof Error ? error.message : String(error))
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="l-agent-answer-card flex flex-col gap-sm">
    <l-markdown
      v-if="answer.value"
      :content="answer.value"
      :components="{ code: LMarkdownCodeRenderer }"
      paragraph-tag="div"
      :streaming="{ hasNextChunk: isBlockRunning(answer) }"
      open-links-in-new-tab
    />

    <template v-if="isA2ui && commands.length">
      <x-card-box
        :commands="commands"
        :components="AGENT_XCARD_COMPONENTS"
        :on-action="onAction"
      >
        <x-card-card :id="surfaceId" />
      </x-card-box>
      <a-alert
        v-if="pendingClarify"
        type="info"
        show-icon
        :message="$t('agent.clarify.fallbackHint')"
      />
    </template>

    <a-space v-if="pendingPlanExit">
      <a-button type="primary" :loading="submitting" @click="confirmPlan(true)">
        {{ $t('agent.toolCall.hitl.confirm') }}
      </a-button>
      <a-button :disabled="submitting" @click="confirmPlan(false)">
        {{ $t('agent.toolCall.hitl.cancel') }}
      </a-button>
    </a-space>
  </div>
</template>
