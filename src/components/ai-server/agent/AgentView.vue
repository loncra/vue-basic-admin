<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, ref} from 'vue'
import {BubbleList as AxBubbleList} from '@antdv-next/x'
import type {BubbleListRef, RoleType} from '@antdv-next/x/dist/bubble/interface'
import {XMarkdown} from '@antdv-next/x-markdown'
import '@antdv-next/x-markdown/themes/index.css'
import '@antdv-next/x-markdown/themes/light.css'
import LInstructionSender from '@/components/basic/InstructionSender.vue'
import {CHAT_BUBBLE_TYPE} from '@/constants/messageConstant.ts'
import {requireNonNullOrUndefined} from '@/utils'
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import type {WorkspaceConversationItem} from "@/types/composables";

defineOptions({
  name: 'LAgentView',
})

const props = withDefaults(defineProps<{
  bubbleListRole: RoleType,
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

const conversation = defineModel<WorkspaceConversationItem>("conversation")

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()

const bubbleListRef = ref<BubbleListRef>()
const senderRef = ref<InstanceType<typeof LInstructionSender>>()

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

defineExpose({
  scrollTo,
  getScrollBox,
  getSenderSlotConfigValue: () => senderRef.value?.getSlotConfigValue() || [],
})
</script>

<template>
  <a-flex
    vertical
    flex="1"
    class="h-full min-h-0 overflow-hidden"
  >
    <a-flex class="h-full min-h-0 overflow-hidden relative flex-[1_1_0]">
      <template v-if="conversation  && conversation.dataSource.elements.length > 0 ">
        <ax-bubble-list
          ref="bubbleListRef"
          class="min-h-0 h-full flex"
          :classes="{ scroll: 'pl-xs pr-xs' }"
          :items="conversation.dataSource.elements"
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
    </a-flex>
    <div class="shrink-0 p-sm border-t border-t-border-secondary">
      <l-instruction-sender
        ref="senderRef"
        :placeholder="globalProperties.$t('agent.view.placeholder')"
        :disabled="false"
        :sending="false"
      >
        <template #leftExtra>
          <a-button shape="circle" size="small">
            <template #icon>
              <icon-font type="loncra-plus"/>
            </template>
          </a-button>
          <a-button size="small" type="text">
            模型选择
          </a-button>
          <a-tag variant="outlined" color="success">
            当前模式
          </a-tag>
        </template>
      </l-instruction-sender>
    </div>
  </a-flex>
</template>
