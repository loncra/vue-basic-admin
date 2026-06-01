import type {Editor, JSONContent} from '@tiptap/core'
import type {
  TipTapJsonValue,
  TipTapModel,
  TipTapUpdatePayload,
  TipTapValue,
} from '@/types/composables/tiptap'

export function emptyTipTapValue(model: TipTapModel): TipTapValue {
  return model === 'json' ? null : ''
}

export function resolveTipTapContent(value: TipTapValue | undefined): string | JSONContent {
  if (value == null || value === '') {
    return ''
  }
  return value as string | JSONContent
}

export function toTipTapModelValue(editor: Editor, model: TipTapModel): TipTapValue {
  if (editor.isEmpty) {
    return emptyTipTapValue(model)
  }
  if (model === 'text') {
    return editor.getText()
  }
  return model === 'html' ? editor.getHTML() : editor.getJSON()
}

export function buildTipTapPayload(editor: Editor, model: TipTapModel): TipTapUpdatePayload {
  const isEmpty = editor.isEmpty
  const json: TipTapJsonValue = isEmpty ? null : editor.getJSON()
  const html = isEmpty ? '' : editor.getHTML()
  const text = isEmpty ? '' : editor.getText()

  return {
    editor,
    value: toTipTapModelValue(editor, model),
    model,
    json,
    html,
    text,
    isEmpty,
  }
}

export function isSameTipTapContent(
  editor: Editor,
  nextValue: TipTapValue | undefined,
  model: TipTapModel,
): boolean {
  if (model === 'text') {
    return (nextValue || '') === (editor.isEmpty ? '' : editor.getText())
  }
  if (model === 'html') {
    return (nextValue || '') === (editor.isEmpty ? '' : editor.getHTML())
  }
  return JSON.stringify(nextValue ?? null) === JSON.stringify(editor.isEmpty ? null : editor.getJSON())
}
