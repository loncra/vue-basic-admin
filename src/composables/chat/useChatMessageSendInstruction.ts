import type {IdValueMetadata} from "@/types/apis";
import {nextTick, type Ref, ref} from "vue";
import type {SenderRef, SlotConfigType} from "@antdv-next/x/dist/sender/interface";
import type {CursorContext} from "@/types/composables";

export interface InstructionProps {
  open: boolean,
  keyword: string,
  measureLocation: number
  activeIndex: number
  command:string
  dataSource:IdValueMetadata<string, string>[]
  anchorStyle: Record<string, string>,
}

export function useChatMessageSendInstruction(
  dataSource:Record<string, IdValueMetadata<string, string>[]>,
  disabled:Ref<boolean>
) {

  let editorScrollTarget: HTMLElement | null = null
  const senderRef = ref<SenderRef>()
  const instructionOption = ref<InstructionProps>({
    open: false,
    keyword: '',
    measureLocation: -1,
    command: '',
    activeIndex: 0,
    dataSource:[],
    anchorStyle: { top: '0px', left: '0px' } as Record<string, string>,
  })
  const isComposing = ref<boolean>(false)

  function getEditableRoot(): HTMLElement | null {
    if (!senderRef.value) {
      return null
    }
    const root = senderRef.value.nativeElement
    if (root.isContentEditable) {
      return root
    }
    return (
      root.querySelector<HTMLElement>('[contenteditable="true"]')
    )
  }

  function advanceSlotIdx(slots: SlotConfigType[], slotIdx: number, child: Node): number {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? ''
      if (!text) {
        return slotIdx
      }
      return slots[slotIdx]?.type === 'text' ? slotIdx + 1 : slotIdx
    }
    if (child instanceof HTMLElement && child.dataset.slotKey && child.dataset.nodeType !== 'nbsp') {
      return slotIdx + 1
    }
    return slotIdx
  }

  function findDirectChildContaining(editable: HTMLElement, node: Node): ChildNode | null {
    let cur: Node | null = node
    while (cur && cur !== editable) {
      if (cur.parentNode === editable) {
        return cur as ChildNode
      }
      cur = cur.parentNode
    }
    return null
  }

  function focusSlot(slotKey: string, cursor: "start" | "end" | "all" | "slot") {

    const editable = getEditableRoot()
    if (!editable) {
      return
    }
    const slotEl = editable.querySelector<HTMLElement>(
      `[data-slot-key="${slotKey}"]:not([data-node-type="nbsp"])`,
    )
    if (!slotEl) {
      senderRef?.value?.focus({ cursor })
      return
    }
    editable.focus()
    const sel = window.getSelection()
    if (!sel) {
      return
    }
    const range = document.createRange()
    range.setStartAfter(slotEl)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
  }

  function resolveCursorContext(): CursorContext | null {

    const editable = getEditableRoot()
    const sel = window.getSelection()
    if (!editable || !sel?.rangeCount || !sel.anchorNode || !editable.contains(sel.anchorNode)) {
      return null
    }
    const slots = senderRef?.value?.getValue()?.slotConfig ?? []
    const { anchorNode, anchorOffset } = sel
    // 容器选区：光标在 editable 子节点缝隙里（空行、块后最常见）
    if (anchorNode === editable) {
      let slotIdx = 0
      for (let i = 0; i < anchorOffset; i++) {
        const child = editable.childNodes[i]
        if (child) {
          slotIdx = advanceSlotIdx(slots, slotIdx, child)
        }
      }
      return { slotIdx, textOffset: 0, isAtLineStart: true }
    }
    const directChild = findDirectChildContaining(editable, anchorNode)
    if (!directChild) {
      return null
    }
    let slotIdx = 0
    for (const child of editable.childNodes) {
      if (child !== directChild) {
        slotIdx = advanceSlotIdx(slots, slotIdx, child)
        continue
      }
      if (child.nodeType === Node.TEXT_NODE) {
        const textNode = child as Text
        const offset =
          anchorNode.nodeType === Node.TEXT_NODE && anchorNode === textNode
            ? anchorOffset
            : 0
        return {
          slotIdx,
          textOffset: offset,
          isAtLineStart: offset === 0,
        }
      }
      if (child instanceof HTMLBRElement) {
        return { slotIdx, textOffset: 0, isAtLineStart: true }
      }
      // custom / content 词槽（含 AttachmentUpload portal）
      return { slotIdx, textOffset: 0, isAtLineStart: true }
    }
    return null
  }

  function closeInstruction() {
    instructionOption.value.open = false
    instructionOption.value.keyword = ''
    instructionOption.value.command = ''
    instructionOption.value.measureLocation = -1
    instructionOption.value.activeIndex = 0
  }

  function updateMentionAnchor(editor: HTMLElement) {
    const location = instructionOption.value.measureLocation
    if (location < 0) {
      return
    }
    /*const rect = getCharClientRect(editor, location)
    if (rect) {
      instructionOption.value.anchorStyle = anchorStyleFromRect(rect)
    }*/
  }

  function bindEditorScrollListener() {
    const sender = senderRef.value
    const editor = sender ? getEditableRoot() : null
    if (editor === editorScrollTarget) {
      return
    }
    editorScrollTarget?.removeEventListener('scroll', onEditorScroll)
    editorScrollTarget = editor
    editor?.addEventListener('scroll', onEditorScroll, { passive: true })
  }

  function onEditorScroll() {
    if (!instructionOption.value.open) {
      return
    }
    const sender = senderRef.value
    const editor = sender ? getEditableRoot() : null
    if (!editor) {
      return
    }
    updateMentionAnchor(editor)
  }

  function syncInstruction() {
    if (isComposing.value || disabled.value) {
      closeInstruction()
      return
    }
    const sender = senderRef.value
    if (!sender) {
      closeInstruction()
      return
    }
    const editor = getEditableRoot()
    if (!editor) {
      closeInstruction()
      return
    }

    bindEditorScrollListener()
  }

  function onCompositionStart() {
    isComposing.value = true
  }

  function onCompositionEnd() {
    isComposing.value = false
    nextTick(syncInstruction)
  }

  function bindCompositionEvents() {
    const editor = getEditableRoot()
    if (!editor || editor.dataset.mentionCompositionBound === '1') {
      return
    }
    editor.dataset.mentionCompositionBound = '1'
    editor.addEventListener('compositionstart', onCompositionStart)
    editor.addEventListener('compositionend', onCompositionEnd)
  }

  function handleChange(value:string, event?:Event, slotConfigType?:SlotConfigType[]) {
    onCompositionStart()
  }

  function handleInstructionPick(option:IdValueMetadata<string, string>){

  }

  return {
    focusSlot,
    resolveCursorContext,
    instructionOption,
    handleInstructionPick,
    handleChange,
  }
}
