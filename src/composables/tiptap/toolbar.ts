import {markRaw} from 'vue'
import LTipTapToolbarButton from '@/components/tiptap/TipTapToolbarButton.vue'
import LTipTapToolbarDropdown from '@/components/tiptap/TipTapToolbarDropdown.vue'
import type {
  TipTapToolbarControl,
  TipTapToolbarControlKey,
  TipTapToolbarOptions,
  TipTapToolbarRenderContext,
} from '@/types/composables/tiptap'
import LTipTapToolbarButtonPopover from "@/components/tiptap/TipTapToolbarButtonPopover.vue";

import i18n from '@/i18n'

export const DEFAULT_TIP_TAP_TOOLBAR_ITEMS: TipTapToolbarControlKey[] = [
  'bold',
  'italic',
  'underline',
  'heading',
  'divider',
  'list',
  'blockquote',
  'align',
  'divider',
  'link',
  'divider',
  'undo',
  'redo'
]

type SelectValue = string | number | Array<string | number>

function isHeadingActive(context: TipTapToolbarRenderContext):boolean {
  const {editor} = context
  for (const level of [1, 2, 3, 4, 5] as const) {
    if (editor.isActive('heading', {level})) {
      return true
    }
  }
  return false
}

function setHeading(context: TipTapToolbarRenderContext, value: SelectValue): void {
  const {editor} = context
  if (value === 'paragraph') {
    editor.chain().focus().setParagraph().run()
    return
  }
  editor
    .chain()
    .focus()
    .toggleHeading({level: Number(value) as 1 | 2 | 3 | 4 | 5})
    .run()
}

function currentList(context: TipTapToolbarRenderContext): string {
  const {editor} = context
  if (editor.isActive('bulletList')) {
    return 'bulletList'
  }
  if (editor.isActive('orderedList')) {
    return 'orderedList'
  }
  return 'none'
}

function setList(context: TipTapToolbarRenderContext, value: SelectValue): void {
  const {editor} = context
  if (value === 'bulletList') {
    editor.chain().focus().toggleBulletList().run()
    return
  }
  if (value === 'orderedList') {
    editor.chain().focus().toggleOrderedList().run()
    return
  }
  if (editor.isActive('bulletList')) {
    editor.chain().focus().toggleBulletList().run()
  } else if (editor.isActive('orderedList')) {
    editor.chain().focus().toggleOrderedList().run()
  }
}

function currentAlign(context: TipTapToolbarRenderContext): string {
  const {editor} = context
  if (editor.isActive({textAlign: 'center'})) {
    return 'center'
  }
  if (editor.isActive({textAlign: 'right'})) {
    return 'right'
  }
  return 'left'
}

function setAlign(context: TipTapToolbarRenderContext, value: SelectValue): void {
  const align = String(value)
  const {editor} = context
  editor.chain().focus().setTextAlign(align).run()
}

function setLink(context: TipTapToolbarRenderContext,url:string): void {
  const {editor} = context
  if (url === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.chain().focus().extendMarkRange('link').setLink({href: url}).run()
}

function setImage(context: TipTapToolbarRenderContext,url:string) {
  const {editor} = context
  if (url) {
    editor.chain().focus().setImage({ src: url }).run()
  }
}

export function createDefaultTipTapToolbarControls(
  context: TipTapToolbarRenderContext,
): Record<TipTapToolbarControlKey, TipTapToolbarControl> {
  const dropdownComponent = markRaw(LTipTapToolbarDropdown)
  const buttonComponent = markRaw(LTipTapToolbarButton)
  const buttonComponentPopover = markRaw(LTipTapToolbarButtonPopover)

  return {
    divider: {
      key: 'divider',
      component: 'divider',
    },
    bold: {
      key: 'bold',
      component: buttonComponent,
      props: {
        icon: 'loncra-bold',
        tooltip: i18n.global.t('component.tiptap.bold'),
        size: context.size,
        disabled: context.disabled,
        active: context.editor.isActive('bold'),
      },
      events: {
        click: () => context.editor.chain().focus().toggleBold().run(),
      },
    },
    italic:{
      key: 'italic',
      component: buttonComponent,
      props: {
        icon: 'loncra-italic',
        tooltip:i18n.global.t('component.tiptap.italic'),
        size: context.size,
        disabled: context.disabled,
        active: context.editor.isActive('italic'),
      },
      events: {
        click: () => context.editor.chain().focus().toggleItalic().run(),
      },
    },
    underline:{
      key: 'underline',
      component: buttonComponent,
      props: {
        icon: 'loncra-underline',
        tooltip:i18n.global.t('component.tiptap.underline'),
        size: context.size,
        active: context.editor.isActive('underline'),
        disabled: context.disabled
      },
      events: {
        click: () => context.editor.chain().focus().toggleUnderline().run(),
      },
    },
    blockquote: {
      key: 'blockquote',
      component: buttonComponent,
      props: {
        icon: 'loncra-quote',
        tooltip:i18n.global.t('component.tiptap.blockquote'),
        size: context.size,
        active: context.editor.isActive('blockquote'),
        disabled: context.disabled
      },
      events: {
        click: () => context.editor.chain().focus().toggleBlockquote().run(),
      },
    },
    heading: {
      key: 'heading',
      component: dropdownComponent,
      props: {
        active: isHeadingActive(context),
        size: context.size,
        disabled: context.disabled,
        options: [
          {label: i18n.global.t('component.tiptap.text'), key: 'paragraph', icon:'loncra-type-outline'},
          {label: i18n.global.t('component.tiptap.title', {number:' ' + 1}), key: '1', icon:'loncra-heading-1'},
          {label: i18n.global.t('component.tiptap.title', {number:' ' + 2}), key: '2', icon:'loncra-heading-2'},
          {label: i18n.global.t('component.tiptap.title', {number:' ' + 3}), key: '3', icon:'loncra-heading-3'},
          {label: i18n.global.t('component.tiptap.title', {number:' ' + 4}), key: '4', icon:'loncra-heading-4'},
          {label: i18n.global.t('component.tiptap.title', {number:' ' + 5}), key: '5', icon:'loncra-heading-5'},
        ],
      },
      events: {
        select: (value) => setHeading(context, value as SelectValue),
      },
    },
    list: {
      key: 'list',
      component: dropdownComponent,
      props: {
        active: currentList(context) !== 'none',
        size: context.size,
        disabled: context.disabled,
        options: [
          {label: i18n.global.t('component.tiptap.list.none'), key: 'none', icon:'loncra-ban'},
          {label: i18n.global.t('component.tiptap.list.bullet'), key: 'bulletList', icon:'loncra-list'},
          {label: i18n.global.t('component.tiptap.list.ordered'), key: 'orderedList', icon: 'loncra-list-ordered'},
        ],
      },
      events: {
        select: (value) => setList(context, value as SelectValue),
      },
    },
    align: {
      key: 'align',
      component: dropdownComponent,
      props: {
        active: currentAlign(context) !== 'left',
        size: context.size,
        disabled: context.disabled,
        options: [
          {label: i18n.global.t('component.tiptap.align.left'), key: 'left', icon:'loncra-text-align-start'},
          {label: i18n.global.t('component.tiptap.align.center'), key: 'center', icon:'loncra-text-align-center'},
          {label: i18n.global.t('component.tiptap.align.right'), key: 'right', icon:'loncra-text-align-end'},
        ],
      },
      events: {
        select: (value) => setAlign(context, value as SelectValue),
      },
    },
    link: {
      key: 'link',
      component: buttonComponentPopover,
      props: {
        icon: 'loncra-paperclip',
        tooltip: i18n.global.t('component.tiptap.link.text'),
        label:i18n.global.t('component.tiptap.link.label'),
        size: context.size,
        active: context.editor.isActive('link'),
        disabled: context.disabled,
      },
      events: {
        confirm: (...args: unknown[]) => setLink(context, String(args[0] ?? '')),
      },
    },
    undo:{
      key: 'undo',
      component: buttonComponent,
      props: {
        icon: 'loncra-step-back',
        tooltip:i18n.global.t('component.tiptap.undo'),
        size: context.size,
        disabled: context.disabled || !context.editor.can().undo(),
      },
      events: {
        click: () => context.editor.chain().focus().undo().run()
      },
    },
    redo: {
      key: 'redo',
      component: buttonComponent,
      props: {
        icon: 'loncra-step-forward',
        tooltip:i18n.global.t('component.tiptap.redo'),
        size: context.size,
        disabled: context.disabled || !context.editor.can().redo(),
      },
      events: {
        click: () => context.editor.chain().focus().redo().run()
      },
    },
    picture: {
      key: 'picture',
      component: buttonComponentPopover,
      props: {
        icon: 'loncra-image-plus',
        tooltip:i18n.global.t('component.tiptap.picture.text'),
        label:i18n.global.t('component.tiptap.picture.label'),
        size: context.size,
        disabled: context.disabled,
      },
      events: {
        confirm: (...args: unknown[]) => setImage(context, String(args[0] ?? '')),
      },
    }
  }
}

export function resolveTipTapToolbarItems(
  toolbar: TipTapToolbarOptions,
  context: TipTapToolbarRenderContext,
): Array<TipTapToolbarControlKey | TipTapToolbarControl> {
  const items = toolbar.items?.length ? toolbar.items : DEFAULT_TIP_TAP_TOOLBAR_ITEMS
  const controls = createDefaultTipTapToolbarControls(context)
  return items.map((item) => (typeof item === 'string' ? controls[item] || item : item))
}

export function resolveTipTapToolbarSize(toolbar: TipTapToolbarOptions): 'small' | 'middle' | 'large' {
  return toolbar.size || 'small'
}
