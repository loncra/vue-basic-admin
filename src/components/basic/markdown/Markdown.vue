<script setup lang="ts">

import {XMarkdown, type XMarkdownProps} from "@antdv-next/x-markdown";

import "@antdv-next/x-markdown/themes/index.css";
import "@antdv-next/x-markdown/themes/light.css";
import "@antdv-next/x-markdown/themes/dark.css";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {CONFIG_PROVIDER_THEME} from "@/constants";
import {computed, nextTick, ref, watch} from "vue";

defineOptions({
  name: 'LMarkdown',
  inheritAttrs: false
})

const configProviderStore = useConfigProviderStore()

const props = withDefaults(
  defineProps<XMarkdownProps & { scrollClass?: string; nearBottomPx?: number }>(),
  { nearBottomPx: 48 },
)

const scrollEl = ref<HTMLElement | null>(null)
/** 仅在流式且用户未主动上翻时自动贴底 */
const autoStickBottom = ref(true)
const markdownThemeClass = computed(() =>
  configProviderStore.state.theme === CONFIG_PROVIDER_THEME.DARK
    ? 'x-markdown-dark'
    : 'x-markdown-light',
)

function isNearBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= props.nearBottomPx
}

function scrollToBottom() {
  const el = scrollEl.value
  if (!el) return
  if (el.scrollHeight <= el.clientHeight) return
  el.scrollTo({ top: el.scrollHeight })
}
function onScroll() {
  const el = scrollEl.value
  if (!el || !props.streaming?.hasNextChunk) {
    return
  }
  // 用户上翻取消自动,否则滚回底部附近,重新贴底
  autoStickBottom.value = isNearBottom(el)
}
async function maybeAutoScroll() {
  if (!props.streaming?.hasNextChunk || !autoStickBottom.value) return
  await nextTick()
  scrollToBottom()
}

watch(
  () => props.content,
  () => {
    void maybeAutoScroll()
  },
)

</script>

<template>
  <div
    ref="scrollEl"
    :class="[
      props.scrollClass ? 'overflow-auto' : undefined,
      props.scrollClass,
    ]"
    @scroll.passive="onScroll"
  >
    <x-markdown
      v-bind="props"
      :class="markdownThemeClass"
    />
  </div>
</template>

