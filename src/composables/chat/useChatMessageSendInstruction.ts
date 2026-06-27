import type {IdValueMetadata} from "@/types/apis";
import {nextTick, onUnmounted, type Ref, ref} from "vue";
import type {SenderRef, SlotConfigType} from "@antdv-next/x/dist/sender/interface";
import type {ChatContentBlock, CursorContext} from "@/types/composables";

export interface UseChatMessageSenderInstructionParams {
  instructionMap:Ref<Record<string, IdValueMetadata<string, string>[]>>,
  disabled:Ref<boolean>,
  senderRef:Ref<SenderRef | undefined>,
  onFilterDataSource: (keyword:string,dataSource: IdValueMetadata<string, string>[]) => IdValueMetadata<string, string>[]
}

export interface InstructionProps {
  open:boolean
  measure: ChatInstructionMeasure
  activeIndex: number
  anchorStyle: Record<string, string>,
  displayDataSource:IdValueMetadata<string, string>[]
}

export interface ChatInstructionMeasure {
  location: number
  prefix: string
  keyword: string
  dataSource:IdValueMetadata<string, string>[]
}

const ZERO_WIDTH_SPACE = "\u200B"

export function useChatMessageSendInstruction(
  params:UseChatMessageSenderInstructionParams,
) {

  let editorScrollTarget: HTMLElement | null = null
  let senderVisibilityObserver: IntersectionObserver | undefined
  let observedSenderElement: HTMLElement | undefined
  let viewportListenersBound = false
  let senderResizeObserver: ResizeObserver | undefined

  const instructionOption = ref<InstructionProps>({
    open:false,
    measure:{
      location:-1,
      prefix:'',
      keyword:'',
      dataSource:[]
    },
    displayDataSource:[],
    activeIndex: 0,
    anchorStyle: { top: '0px', left: '0px' } as Record<string, string>,
  })

  const instructionPopoverRef = ref<{ forceAlign?: () => void }>()
  const isComposing = ref<boolean>(false)

  function getEditableRoot(): HTMLElement | null {
    if (!params.senderRef.value) {
      return null
    }
    const root = params.senderRef.value.nativeElement
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
      params.senderRef?.value?.focus({ cursor })
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
    const slots = params.senderRef?.value?.getValue()?.slotConfig ?? []
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
    instructionOption.value.activeIndex = 0
    instructionOption.value.measure.keyword = ''
    instructionOption.value.measure.prefix = ''
    instructionOption.value.measure.location = -1
    instructionOption.value.measure.dataSource = []
    instructionOption.value.displayDataSource = []
    instructionOption.value.open = false
    unbindInstructionViewportWatchers()
  }

  /** 当前光标在视口中的矩形 */
  function getCaretClientRect(): DOMRect | null {
    const sel = window.getSelection()
    if (!sel?.rangeCount || !sel.isCollapsed) {
      return null
    }
    const range = sel.getRangeAt(0).cloneRange()
    let rect = range.getBoundingClientRect()
    // 空矩形（行尾、空行）时插零宽标记测位置
    if (rect.width === 0 && rect.height === 0) {
      const marker = document.createElement('span')
      marker.textContent = ZERO_WIDTH_SPACE
      marker.style.display = 'inline-block'
      range.insertNode(marker)
      rect = marker.getBoundingClientRect()
      marker.remove()
      sel.removeAllRanges()
      sel.addRange(range) // 恢复选区
    }
    return rect
  }

  function isInstructionContextVisible(): boolean {
    const editor = getEditableRoot()
    const senderEl = params.senderRef.value?.nativeElement
    if (!editor || !senderEl) return false
    // sender 整体是否还在视口内（留一点 margin）
    const senderRect = senderEl.getBoundingClientRect()
    const margin = 8
    const inViewport =
      senderRect.bottom > margin &&
      senderRect.top < window.innerHeight - margin &&
      senderRect.right > margin &&
      senderRect.left < window.innerWidth - margin
    if (!inViewport) return false
    // 光标是否还在 editor 内
    const sel = window.getSelection()
    if (!sel?.rangeCount || !editor.contains(sel.anchorNode)) return false
    // 光标矩形是否大致在视口内（允许行尾 partial）
    const caretRect = getCaretClientRect()
    if (!caretRect) return false
    return (
      caretRect.bottom >= 0 &&
      caretRect.top <= window.innerHeight &&
      caretRect.right >= 0 &&
      caretRect.left <= window.innerWidth
    )
  }

  function updateInstructionAnchor() {
    if (!instructionOption.value.open) {
      return
    }
    const rect = getCaretClientRect()
    if (!rect) {
      closeInstruction()
      return
    }
    instructionOption.value.anchorStyle = {
      top: `${rect.top}px`,
      left: `${rect.left}px`,
    }
    nextTick(() => requestAnimationFrame(() => instructionPopoverRef.value?.forceAlign?.()))
  }

  function onInstructionViewportChange() {
    if (!instructionOption.value.open) {
      return
    }
    if (!isInstructionContextVisible()) {
      closeInstruction()
      return
    }
    updateInstructionAnchor()
  }

  function onSenderVisibilityChange(entries: IntersectionObserverEntry[]) {
    if (!instructionOption.value.open) {
      return
    }
    const entry = entries[0]
    if (!entry) {
      return
    }
    // 完全不可见，或只剩极少一部分 → 关闭快捷面板
    if (!entry.isIntersecting || entry.intersectionRatio < 0.01) {
      closeInstruction()
      return
    }
    updateInstructionAnchor()
  }

  function bindSenderVisibilityObserver() {
    const senderEl = params.senderRef.value?.nativeElement
    if (!senderEl) {
      return
    }
    if (observedSenderElement === senderEl && senderVisibilityObserver) {
      return
    }
    unbindSenderVisibilityObserver()
    senderVisibilityObserver = new IntersectionObserver(onSenderVisibilityChange, {
      root: null,
      threshold: [0, 0.01, 1],
    })
    senderVisibilityObserver.observe(senderEl)
    observedSenderElement = senderEl
  }

  function unbindSenderVisibilityObserver() {
    senderVisibilityObserver?.disconnect()
    senderVisibilityObserver = undefined
    observedSenderElement = undefined
  }

  function bindViewportListeners() {
    if (viewportListenersBound) {
      return
    }
    window.addEventListener('resize', onInstructionViewportChange, { passive: true })
    window.addEventListener('scroll', onInstructionViewportChange, { passive: true, capture: true })
    window.visualViewport?.addEventListener('resize', onInstructionViewportChange, { passive: true })
    window.visualViewport?.addEventListener('scroll', onInstructionViewportChange, { passive: true })
    viewportListenersBound = true
  }
  function unbindViewportListeners() {
    if (!viewportListenersBound) {
      return
    }
    window.removeEventListener('resize', onInstructionViewportChange)
    window.removeEventListener('scroll', onInstructionViewportChange, true)
    window.visualViewport?.removeEventListener('resize', onInstructionViewportChange)
    window.visualViewport?.removeEventListener('scroll', onInstructionViewportChange)
    viewportListenersBound = false
  }

  function bindSenderResizeObserver() {
    const senderEl = params.senderRef.value?.nativeElement
    if (!senderEl) return
    senderResizeObserver?.disconnect()
    senderResizeObserver = new ResizeObserver(() => {
      onInstructionViewportChange()
    })
    senderResizeObserver.observe(senderEl)
  }

  function unbindSenderResizeObserver() {
    senderResizeObserver?.disconnect()
    senderResizeObserver = undefined
  }

  function bindInstructionViewportWatchers() {
    bindSenderVisibilityObserver()
    bindViewportListeners()
    bindSenderResizeObserver()
  }

  function unbindInstructionViewportWatchers() {
    unbindSenderVisibilityObserver()
    unbindViewportListeners()
    unbindSenderResizeObserver()
  }

  function bindEditorScrollListener() {
    const sender = params.senderRef.value
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
    updateInstructionAnchor()
  }

  /** 光标前纯文本（contenteditable） */
  function getTextBeforeCursor(editor: HTMLElement): string {
    const sel = window.getSelection()
    if (!sel?.rangeCount || !sel.isCollapsed) {
      return ''
    }
    const range = sel.getRangeAt(0)
    if (!editor.contains(range.startContainer)) {
      return ''
    }
    const pre = document.createRange()
    pre.selectNodeContents(editor)
    pre.setEnd(range.startContainer, range.startOffset)
    return pre.toString().replace(new RegExp(ZERO_WIDTH_SPACE, 'g'), '')
  }

  /** 找光标前最后一个 快捷字符 的位置（对齐 a-mentions getLastMeasureIndex） */
  function getLastMeasureIndex(text: string, prefix:string): { location: number; prefix: string, dataSource:IdValueMetadata<string, string>[] } {
    const lastIndex = text.lastIndexOf(prefix)
    if (lastIndex < 0) {
      return { location: -1, prefix: '',dataSource:[] }
    }
    return { location: lastIndex, prefix, dataSource:params.instructionMap.value[prefix] || [] }
  }

  /** 快捷字符前须为行首或空白（排除 foo[快捷字符]bar） */
  function isValidInstructionTrigger(textBefore: string, location: number): boolean {
    if (location < 0) {
      return false
    }
    if (location === 0) {
      return true
    }
    return new RegExp(`[\\s${ZERO_WIDTH_SPACE}]`, 'g').test(textBefore[location - 1] ?? '')
  }

  /** keyword 内不能含 split（默认空格结束快捷输入） */
  function validateInstructionSearch(keyword: string, split = ' '): boolean {
    return !split || keyword.indexOf(split) === -1
  }

  function parseInstructionMeasure(
    textBefore: string,
    split = ' ',
  ): ChatInstructionMeasure | null {
    for (const key in params.instructionMap.value) {
      const { location, prefix, dataSource } = getLastMeasureIndex(textBefore, key)
      if (!isValidInstructionTrigger(textBefore, location)) {
        continue
      }
      const keyword = textBefore.slice(location + prefix.length)
      if (!validateInstructionSearch(keyword, split)) {
        continue
      }
      return {
        location,
        prefix,
        keyword,
        dataSource
      }
    }

    return null
  }

  function syncInstruction() {
    if (isComposing.value || params.disabled.value) {
      closeInstruction()
      return
    }
    const sender = params.senderRef.value
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
    bindInstructionViewportWatchers()
    const measure = parseInstructionMeasure(getTextBeforeCursor(editor))
    if (!measure) {
      closeInstruction()
      return
    }

    const isNewSession =
      !instructionOption.value.open
      || instructionOption.value.measure.location !== measure.location

    instructionOption.value.measure = measure
    instructionOption.value.activeIndex = isNewSession ? 0 : instructionOption.value.activeIndex
    updateInstructionAnchor()
    instructionOption.value.displayDataSource = params.onFilterDataSource(instructionOption.value.measure.keyword, [...instructionOption.value.measure.dataSource])

    instructionOption.value.open = true
    bindInstructionViewportWatchers()
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
    if (!editor || editor.dataset.InstructionCompositionBound === '1') {
      return
    }
    editor.dataset.InstructionCompositionBound = '1'
    editor.addEventListener('compositionstart', onCompositionStart)
    editor.addEventListener('compositionend', onCompositionEnd)
  }

  function handleSenderChange(value:string, event?:Event, slotConfigType?:SlotConfigType[]) {
    bindCompositionEvents()
    nextTick(syncInstruction)
  }

  function handleInstructionPick(option:IdValueMetadata<string, string>){
    const block:ChatContentBlock = {
      type:'custom',
      slotKind:'instruction',
      value:option
    }
    closeInstruction()
  }

  function handleSenderKeyDown(e: KeyboardEvent) {
    if (!instructionOption.value.open) {
      return
    }
    const options = instructionOption.value.displayDataSource
    if (e.key === 'Escape') {
      e.preventDefault()
      closeInstruction()
      return false
    }
    if (options.length === 0) {
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      instructionOption.value.activeIndex = (instructionOption.value.activeIndex + 1) % options.length
      return false
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      instructionOption.value.activeIndex =
        (instructionOption.value.activeIndex - 1 + options.length) % options.length
      return false
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const picked = options[instructionOption.value.activeIndex]
      if (picked) {
        handleInstructionPick(picked)
      }
      return false
    }
  }

  onUnmounted(() => {
    unbindInstructionViewportWatchers()
    editorScrollTarget?.removeEventListener('scroll', onEditorScroll)
    editorScrollTarget = null
    const editor = getEditableRoot()
    if (editor) {
      editor.removeEventListener('compositionstart', onCompositionStart)
      editor.removeEventListener('compositionend', onCompositionEnd)
    }
  })

  return {
    instructionPopoverRef,
    instructionOption,
    handleInstructionPick,
    handleSenderKeyDown,
    handleSenderChange,
  }
}
