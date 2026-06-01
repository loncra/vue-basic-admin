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
        icon: 'icon-editor-bold',
        tooltip:'加粗',
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
        icon: 'icon-editor-italic',
        tooltip:'斜体',
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
        icon: 'icon-editor-under-line',
        tooltip:'下划线',
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
        icon: 'icon-editor-text',
        tooltip:'引用',
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
          {label: '正文', key: 'paragraph'},
          {label: '标题 1', key: '1'},
          {label: '标题 2', key: '2'},
          {label: '标题 3', key: '3'},
          {label: '标题 4', key: '4'},
          {label: '标题 5', key: '5'},
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
          {label: '无列表', key: 'none', icon:'icon-error'},
          {label: '无序列表', key: 'bulletList', icon:'icon-category'},
          {label: '有序列表', key: 'orderedList', icon: 'icon-list'},
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
          {label: '左对齐', key: 'left', icon:'icon-editor-left-alignment'},
          {label: '居中', key: 'center', icon:'icon-editor-center-alignment'},
          {label: '右对齐', key: 'right', icon:'icon-editor-right-alignment'},
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
        icon: 'icon-link',
        tooltip:'超链接',
        label:'链接地址',
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
        icon: 'icon-left',
        tooltip:'撤销',
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
        icon: 'icon-right',
        tooltip:'重做',
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
        icon: 'icon-picture',
        tooltip:'图片',
        label:'图片地址',
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
