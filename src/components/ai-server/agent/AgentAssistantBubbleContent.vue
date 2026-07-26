<script setup lang="ts">
import {XMarkdown} from '@antdv-next/x-markdown'
import '@antdv-next/x-markdown/themes/index.css'
import '@antdv-next/x-markdown/themes/light.css'
import type {AgentSseMessageContent, AgentTextMessageContent,} from '@/types/composables'
import {AGENT_CONTENT_TYPE} from "@/constants";
import {computed} from "vue";

defineOptions({
  name: 'LAgentAssistantBubbleContent',
})

const props = withDefaults(defineProps<{
  content: AgentSseMessageContent[]
}>(),{
  content: () => []
})

const errorList = computed<AgentTextMessageContent[]>(() => props.content.filter(s => s.type === AGENT_CONTENT_TYPE.ERROR))
const answerText = computed<string>(() => props.content.filter(s => s.type === AGENT_CONTENT_TYPE.ANSWER).map(s => (s as AgentTextMessageContent).value).join())

</script>

<template>
  <a-flex vertical gap="small" class="w-full min-w-0">
    <x-markdown
      v-if="answerText"
      :content="answerText"
      open-links-in-new-tab
      escape-raw-html
    />
    <a-alert :key="error.id" v-for="error of errorList" type="error" show-icon :message="error.value" />
  </a-flex>
</template>
