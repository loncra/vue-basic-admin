<script setup lang="ts">
import {computed, onBeforeUnmount, ref, watch} from 'vue'
import {EditorContent, useEditor} from '@tiptap/vue-3'
import type {Editor, EditorOptions} from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Heading from '@tiptap/extension-heading'
import Paragraph from '@tiptap/extension-paragraph'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import {useFormItemContext} from 'antdv-next/dist/form/context'
import LTipTapToolbar from '@/components/tiptap/TipTapToolbar.vue'
import {
  buildTipTapPayload,
  isSameTipTapContent,
  resolveTipTapContent,
  toTipTapModelValue,
} from '@/composables/tiptap/tiptap'
import type {
  TipTapAutofocus,
  TipTapEditorProps,
  TipTapExtensions,
  TipTapMediaErrorPayload,
  TipTapMediaOptions,
  TipTapMediaPayload,
  TipTapModel,
  TipTapToolbarOptions,
  TipTapUpdatePayload,
  TipTapValue,
} from '@/types/composables/tiptap'

defineOptions({
  name: 'LTipTap',
})

const props = withDefaults(
  defineProps<{
    model?: TipTapModel
    placeholder?: string
    disabled?: boolean
    toolbar?: false | TipTapToolbarOptions
    media?: TipTapMediaOptions
    class?: number | string
    extensions?: TipTapExtensions
    editorProps?: TipTapEditorProps
    autofocus?: TipTapAutofocus
  }>(),
  {
    model: 'html',
    placeholder: '请输入内容',
    disabled: false,
    class: '',
    extensions: () => [],
  },
)

const emit = defineEmits<{
  update: [payload: TipTapUpdatePayload]
  focus: [payload: {editor: Editor}]
  blur: [payload: {editor: Editor}]
  mediaResolve: [payload: TipTapMediaPayload]
  mediaInsert: [payload: TipTapMediaPayload]
  mediaError: [payload: TipTapMediaErrorPayload]
}>()

const value = defineModel<TipTapValue>('value')
const formItemContext = useFormItemContext()
const mediaModalOpen = ref(false)

const toolbarConfig = computed(() =>
  props.toolbar && typeof props.toolbar === 'object' ? props.toolbar : undefined,
)

const editorOptions: Partial<EditorOptions> = {
  content: resolveTipTapContent(value.value),
  editable: !props.disabled,
  extensions: [
    StarterKit.configure({
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      },
    }),
    Heading.configure({
      HTMLAttributes: {
        class: 'ant-typography',
      },
    }),
    Paragraph.configure({
      HTMLAttributes: {
        class: 'ant-typography',
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
      resize: {
        enabled: true,
        alwaysPreserveAspectRatio: true,
      }
    }),
    ...props.extensions,
  ],
  onUpdate: ({editor: currentEditor}) => {
    value.value = toTipTapModelValue(currentEditor, props.model)
    emit('update', buildTipTapPayload(currentEditor, props.model))
  },
  onFocus: ({editor: currentEditor}) => emit('focus', {editor: currentEditor}),
  onBlur: ({editor: currentEditor}) => emit('blur', {editor: currentEditor}),
}

if (props.autofocus !== undefined) {
  editorOptions.autofocus = props.autofocus
}

if (props.editorProps !== undefined) {
  editorOptions.editorProps = props.editorProps
}

const editor = useEditor(editorOptions)

watch(
  value,
  (v) => {
    const currentEditor = editor.value
    if (!currentEditor || isSameTipTapContent(currentEditor, v, props.model)) {
      return
    }
    currentEditor.commands.setContent(resolveTipTapContent(v), {emitUpdate: false})
  },
  {deep: true},
)

watch(value, () => {
  formItemContext?.triggerChange()
}, {deep: true})


function openMediaModal(): void {
  mediaModalOpen.value = true
}

function focus(): void {
  editor.value?.commands.focus()
}

function clearContent(): void {
  editor.value?.commands.clearContent()
}

function setEditable(editable: boolean): void {
  editor.value?.setEditable(editable)
}

function getEditor(): Editor | undefined {
  return editor.value
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})

defineExpose({
  focus,
  clearContent,
  setEditable,
  getEditor,
})
</script>

<template>
  <div :class="'loncra-tip-tap ' + (props.disabled ? 'disabled' : '')" >
    <template v-if="editor && toolbarConfig">
      <slot
        v-if="$slots.toolbar"
        name="toolbar"
        :editor="editor"
        :disabled="props.disabled"
        :toolbar="toolbarConfig"
      />
      <l-tip-tap-toolbar
        v-else
        :editor="editor"
        :toolbar="toolbarConfig"
        :disabled="props.disabled"
        :open-media-modal="openMediaModal"
      >
        <template #toolbar-before="slotProps">
          <slot name="toolbar-before" v-bind="slotProps" />
        </template>
        <template #toolbar-control="slotProps">
          <slot name="toolbar-control" v-bind="slotProps" />
        </template>
        <template #toolbar-extra="slotProps">
          <slot name="toolbar-extra" v-bind="slotProps" />
        </template>
        <template #toolbar-after="slotProps">
          <slot name="toolbar-after" v-bind="slotProps" />
        </template>
      </l-tip-tap-toolbar>
    </template>

    <editor-content :class="'loncra-tip-tap-content ' + props.class" :editor="editor" />

  </div>
</template>
