import type {AnyExtension, Editor, EditorOptions, JSONContent} from '@tiptap/core'
import type {Component, Raw} from 'vue'

export type TipTapModel = 'text' | 'html' | 'json'

export type TipTapJsonValue = JSONContent | null

export type TipTapValue = TipTapJsonValue | string

export type TipTapExtensions = AnyExtension[]

export type TipTapToolbarControlKey =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'blockquote'
  | 'heading'
  | 'list'
  | 'align'
  | 'link'
  | 'redo'
  | 'picture'
  | 'undo'
  | 'divider'

export type TipTapToolbarSize = 'small' | 'middle' | 'large'

export type TipTapToolbarControlComponent = string | Raw<Component>

export interface TipTapToolbarRenderContext {
  editor: Editor
  disabled: boolean
  size: TipTapToolbarSize
  openMediaModal: () => void
}

export interface TipTapToolbarControl {
  key: string
  component: TipTapToolbarControlComponent
  props?:
    | Record<string, unknown>
    | ((context: TipTapToolbarRenderContext) => Record<string, unknown>)
  events?:
    | Record<string, (...args: unknown[]) => void>
    | ((context: TipTapToolbarRenderContext) => Record<string, (...args: unknown[]) => void>)
}

export interface TipTapToolbarOptions {
  items?: Array<TipTapToolbarControlKey | TipTapToolbarControl>
  size?: TipTapToolbarSize
  props?: Record<string, unknown>
}

export interface  TipTapToolbarDropdownOption {
  icon?:string
  label:string
  key:string
}

export type TipTapMediaType = 'image' | 'video'

export interface TipTapMediaValue {
  type: TipTapMediaType
  src: string
  alt?: string
  title?: string
  width?: number | string
  height?: number | string
  align?: 'left' | 'center' | 'right'
}

export interface TipTapMediaResolveContext {
  file: File
  mediaType: TipTapMediaType
}

export type TipTapMediaResolver = (
  file: File,
  context: TipTapMediaResolveContext,
) => TipTapMediaValue | Promise<TipTapMediaValue>

export interface TipTapMediaOptions {
  accept?: string
  maxSize?: number
  resolver?: TipTapMediaResolver
  uploadProps?: Record<string, unknown>
}

export interface TipTapToolbarSlotProps {
  editor: Editor
  disabled: boolean
  toolbar: TipTapToolbarOptions
}

export interface TipTapToolbarControlSlotProps extends TipTapToolbarSlotProps {
  item: TipTapToolbarControlKey | TipTapToolbarControl
  control?: TipTapToolbarControl
}

export interface TipTapUpdatePayload {
  editor: Editor
  value: TipTapValue
  model: TipTapModel
  json: TipTapJsonValue
  html: string
  text: string
  isEmpty: boolean
}

export interface TipTapMediaPayload {
  editor: Editor
  media: TipTapMediaValue
}

export interface TipTapMediaErrorPayload {
  error: unknown
  file?: File
  mediaType?: TipTapMediaType
}

export type TipTapEditorProps = EditorOptions['editorProps']

export type TipTapAutofocus = EditorOptions['autofocus']
