<script setup lang="ts">
import type {Editor} from '@tiptap/core'
import {computed} from 'vue'
import {resolveTipTapToolbarItems, resolveTipTapToolbarSize,} from '@/composables/tiptap/toolbar'
import type {
  TipTapToolbarControl,
  TipTapToolbarControlKey,
  TipTapToolbarOptions,
  TipTapToolbarRenderContext,
} from '@/types/composables/tiptap'

defineOptions({
  name: 'LTipTapToolbar',
})

const props = defineProps<{
  editor: Editor
  toolbar: TipTapToolbarOptions
  disabled?: boolean
  openMediaModal: () => void
}>()

const size = computed(() => resolveTipTapToolbarSize(props.toolbar))
const context = computed<TipTapToolbarRenderContext>(() => ({
  editor: props.editor,
  disabled: Boolean(props.disabled),
  size: size.value,
  openMediaModal: props.openMediaModal,
}))

const items = computed(() => resolveTipTapToolbarItems(props.toolbar, context.value))

function isDivider(item: TipTapToolbarControlKey | TipTapToolbarControl): boolean {
  return item === 'divider' || (typeof item !== 'string' && item.key === 'divider')
}

function resolveControl(item: TipTapToolbarControlKey | TipTapToolbarControl): TipTapToolbarControl | undefined {
  return typeof item === 'string' ? undefined : item
}

function resolveKey(item: TipTapToolbarControlKey | TipTapToolbarControl, index: number): string {
  return `${typeof item === 'string' ? item : item.key}-${index}`
}

function resolveProps(control: TipTapToolbarControl): Record<string, unknown> {
  return typeof control.props === 'function' ? control.props(context.value) : control.props || {}
}

function resolveEvents(control: TipTapToolbarControl): Record<string, (...args: unknown[]) => void> {
  return typeof control.events === 'function' ? control.events(context.value) : control.events || {}
}
</script>

<template>
  <a-space class="l-tip-tap-toolbar" align="center" wrap v-bind="toolbar.props">
    <slot name="toolbar-before" :editor="editor" :disabled="Boolean(disabled)" :toolbar="toolbar" />

    <template v-for="(item, index) in items" :key="resolveKey(item, index)">
      <a-divider v-if="isDivider(item)" type="vertical" class="m-0" />
      <slot
        v-else
        name="toolbar-control"
        :item="item"
        :control="resolveControl(item)"
        :editor="editor"
        :disabled="Boolean(disabled)"
        :toolbar="toolbar"
      >
        <component
          :is="resolveControl(item)?.component"
          v-if="resolveControl(item)"
          v-bind="resolveProps(resolveControl(item)!)"
          v-on="resolveEvents(resolveControl(item)!)"
        />
      </slot>
    </template>

    <slot name="toolbar-extra" :editor="editor" :disabled="Boolean(disabled)" :toolbar="toolbar" />
    <slot name="toolbar-after" :editor="editor" :disabled="Boolean(disabled)" :toolbar="toolbar" />
  </a-space>
</template>

<style scoped>

</style>
