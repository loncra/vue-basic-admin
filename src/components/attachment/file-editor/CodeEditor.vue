<script setup lang="ts">
import {onMounted, onUnmounted, ref, watch} from 'vue'
import {basicSetup} from 'codemirror'
import {EditorState} from '@codemirror/state'
import {EditorView} from '@codemirror/view'
import {oneDark} from '@codemirror/theme-one-dark'
import {loadLanguage} from '@/composables/attachment/filePaneKinds.ts'
import {useConfigProviderStore} from '@/stores/configProviderStore.ts'
import {CONFIG_PROVIDER_THEME} from '@/constants'

defineOptions({
  name: 'LFileCodeEditor',
})

const props = defineProps<{
  ext: string
  readonly: boolean
}>()

const modelValue = defineModel<string>({default: ''})

const root = ref<HTMLDivElement>()
const configProviderStore = useConfigProviderStore()

let view: EditorView | undefined
let createGeneration = 0

async function createEditor() {
  const generation = ++createGeneration
  view?.destroy()
  view = undefined
  if (!root.value) {
    return
  }
  const lang = await loadLanguage(props.ext)
  if (generation !== createGeneration || !root.value) {
    return
  }
  const extensions = [
    basicSetup,
    EditorView.lineWrapping,
    EditorView.editable.of(!props.readonly),
    EditorState.readOnly.of(props.readonly),
    EditorView.theme({
      '&': {height: '100%'},
      '.cm-scroller': {overflow: 'auto'},
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        modelValue.value = update.state.doc.toString()
      }
    }),
  ]
  if (configProviderStore.getTheme() === CONFIG_PROVIDER_THEME.DARK) {
    extensions.push(oneDark)
  }
  if (lang) {
    extensions.push(lang)
  }
  view = new EditorView({
    parent: root.value,
    state: EditorState.create({
      doc: modelValue.value,
      extensions,
    }),
  })
}

onMounted(() => {
  void createEditor()
})

watch(
  () => [props.ext, props.readonly, configProviderStore.state.theme] as const,
  () => {
    void createEditor()
  },
)

onUnmounted(() => {
  createGeneration++
  view?.destroy()
  view = undefined
})
</script>

<template>
  <div ref="root" class="size-full min-h-0 overflow-hidden" />
</template>
