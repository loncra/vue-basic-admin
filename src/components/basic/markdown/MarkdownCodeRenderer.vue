<script setup lang="ts">
import {CodeHighlighter as AxCodeHighlighter} from '@antdv-next/x'
import {computed, isVNode, Text, useAttrs, useSlots, type VNode} from 'vue'
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {CONFIG_PROVIDER_THEME} from "@/constants";

defineOptions({
  name: 'LMarkdownCodeRenderer',
})

const slots = useSlots()
const attrs = useAttrs()

const configProviderStore = useConfigProviderStore()

function toText(nodes: unknown): string {
  if (nodes == null) {
    return ''
  }
  if (typeof nodes === 'string' || typeof nodes === 'number') {
    return String(nodes)
  }
  if (Array.isArray(nodes)) {
    return nodes.map(toText).join('')
  }
  if (!isVNode(nodes)) {
    return ''
  }
  const vnode = nodes as VNode
  if (vnode.type === Text) {
    return typeof vnode.children === 'string' ? vnode.children : ''
  }
  const textProp = (vnode.props as {text?: unknown} | null)?.text
  if (typeof textProp === 'string') {
    return textProp
  }
  if (typeof vnode.children === 'string') {
    return vnode.children
  }
  if (Array.isArray(vnode.children)) {
    return toText(vnode.children)
  }
  if (vnode.children && typeof vnode.children === 'object' && 'default' in vnode.children) {
    const slot = (vnode.children as {default?: () => unknown}).default
    return toText(slot?.())
  }
  return ''
}

function getCodeText(): string {
  return toText(slots.default?.())
}

const isBlock = computed(() => {
  const dataBlock = attrs["data-block"];
  const dataBlockCamel = attrs.dataBlock;
  const block = attrs.block;

  return (
    dataBlock === "true" ||
    dataBlock === true ||
    dataBlockCamel === "true" ||
    dataBlockCamel === true ||
    block === "true" ||
    block === true
  );
});

const language = computed(() => {
  const dataLang = typeof attrs["data-lang"] === "string" ? attrs["data-lang"] : ""
  const langAttr = typeof attrs.lang === "string" ? attrs.lang : ""
  const className = typeof attrs.class === "string" ? attrs.class : ""
  const classLang = className.match(/(?:^|\s)language-([^\s]+)/)?.[1] ?? ""
  return dataLang || langAttr || classLang
})

</script>

<template>
  <code v-if="!isBlock">{{ getCodeText() }}</code>
  <ax-code-highlighter
    v-else
    :content="getCodeText()"
    :language="language"
    :theme="configProviderStore.state.theme === CONFIG_PROVIDER_THEME.DARK ? 'dark' : 'light'"
    show-line-numbers
    show-copy-button
  />
</template>
