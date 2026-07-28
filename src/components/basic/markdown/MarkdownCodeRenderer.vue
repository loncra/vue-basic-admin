<script setup lang="ts">
import {CodeHighlighter as AxCodeHighlighter} from '@antdv-next/x'
import type {ComponentProps} from '@antdv-next/x-markdown'
import {computed, isVNode, Text, useSlots, type VNode} from 'vue'

defineOptions({
  name: 'LMarkdownCodeRenderer',
})

const props = defineProps<ComponentProps & {block?: boolean; lang?: string; class?: string}>()
const slots = useSlots()

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

const language = computed(() => {
  const className = typeof props.class === 'string' ? props.class : ''
  return (
    props.lang ||
    className.match(/(?:^|\s)language-([^\s]+)/)?.[1] ||
    className.match(/(?:^|\s)lang-([^\s]+)/)?.[1] ||
    'text'
  )
})

</script>

<template>
  <code v-if="!block">{{ getCodeText() }}</code>
  <ax-code-highlighter
    v-else
    :content="getCodeText()"
    :language="language"
    show-line-numbers
    show-language
    show-copy-button
  />
</template>
