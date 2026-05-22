import 'cropperjs'
import {nextTick, onBeforeUnmount, ref} from 'vue'
import type {CropperOutputResult, CropperOutputScale} from '@/types/composables/cropperModal.ts'

export const CROPPER_SELECTION_ID = 'lcropper-selection'

interface CropperElements {
  canvas: CropperCanvasElement
  image: CropperImageElement
  selection: CropperSelectionElement
}

interface CropperBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface CropperImageElement extends HTMLElement {
  $ready(): Promise<HTMLImageElement>
  $center(size?: string): CropperImageElement
  $zoom(ratio: number): CropperImageElement
  $move(x: number, y?: number): CropperImageElement
  $rotate(degree: number | string): CropperImageElement
  $resetTransform(): CropperImageElement
  cloneNode(deep?: boolean): CropperImageElement
}

export interface CropperSelectionElement extends HTMLElement {
  aspectRatio: number
  initialAspectRatio: number
  width: number
  height: number
  movable: boolean
  resizable: boolean
  $reset(): CropperSelectionElement
  $center(): CropperSelectionElement
  $move(x: number, y: number): CropperSelectionElement
  $toCanvas(options?: {
    width?: number
    height?: number
    beforeDraw?: (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void
  }): Promise<HTMLCanvasElement>
}

export interface CropperCanvasElement extends HTMLElement {
  getBoundingClientRect(): DOMRect
}

export interface CropToBlobOptions {
  mimeType: string
  quality: number
}

export interface CropToBlobResult {
  blob: Blob
  dataUrl: string
}

type ImageFitMode = 'contain' | 'cover'
type DragMode = 'image' | 'selection'

async function waitForCropperElements(
  cropperHostRef: { value?: HTMLElement },
  cropperCanvasRef: { value?: CropperCanvasElement },
  cropperImageRef: { value?: CropperImageElement },
  cropperSelectionRef: { value?: CropperSelectionElement },
): Promise<CropperElements | null> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const elements = resolveCropperElements(
      cropperHostRef,
      cropperCanvasRef,
      cropperImageRef,
      cropperSelectionRef,
    )
    if (elements) {
      return elements
    }
    await nextTick()
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
  }
  return null
}

function resolveCropperElements(
  cropperHostRef: { value?: HTMLElement },
  cropperCanvasRef: { value?: CropperCanvasElement },
  cropperImageRef: { value?: CropperImageElement },
  cropperSelectionRef: { value?: CropperSelectionElement },
): CropperElements | null {
  const canvas = (cropperCanvasRef.value
    ?? cropperHostRef.value?.querySelector('cropper-canvas')) as CropperCanvasElement | null
  if (!canvas) {
    return null
  }
  const image = (cropperImageRef.value
    ?? canvas.querySelector('cropper-image')) as CropperImageElement | null
  const selection = (cropperSelectionRef.value
    ?? canvas.querySelector(`#${CROPPER_SELECTION_ID}`)) as CropperSelectionElement | null
  if (!image || !selection) {
    return null
  }
  return {canvas, image, selection}
}

function isSelectionReady(selection: CropperSelectionElement): boolean {
  return selection.width > 0 && selection.height > 0
}

function pointInRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
}

function getImageRectWithMatrix(
  image: CropperImageElement,
  canvas: CropperCanvasElement,
  matrix: number[],
): DOMRect {
  const clone = image.cloneNode() as CropperImageElement
  clone.style.transform = `matrix(${matrix.join(', ')})`
  clone.style.opacity = '0'
  canvas.appendChild(clone)
  const rect = clone.getBoundingClientRect()
  canvas.removeChild(clone)
  return rect
}

function getHandleAction(target: EventTarget | null): string {
  if (!(target instanceof Element)) {
    return ''
  }
  let el: Element | null = target
  while (el) {
    if (el instanceof HTMLElement) {
      const action = el.getAttribute('action') ?? (el as unknown as {action?: string}).action ?? ''
      if (action) {
        return action
      }
    }
    el = el.parentElement
  }
  return ''
}

function isResizeOrSelectAction(action: string): boolean {
  return action === 'select' || action.includes('resize')
}

function isSelectionMovable(selection: CropperSelectionElement): boolean {
  return selection.movable || selection.hasAttribute('movable')
}

function resolveDragMode(
  clientX: number,
  clientY: number,
  image: CropperImageElement,
  selection: CropperSelectionElement,
): DragMode | null {
  const inSelection = pointInRect(clientX, clientY, selection.getBoundingClientRect())
  const onImage = pointInRect(clientX, clientY, image.getBoundingClientRect())

  // 剪切框内 → 拖选区；剪切框外且在图片上 → 拖图片
  if (inSelection && isSelectionMovable(selection)) {
    return 'selection'
  }
  if (!inSelection && onImage) {
    return 'image'
  }
  return null
}

function isWithinBounds(selection: CropperBounds, max: CropperBounds): boolean {
  const eps = 0.5
  return (
    selection.x >= max.x - eps
    && selection.y >= max.y - eps
    && (selection.x + selection.width) <= (max.x + max.width) + eps
    && (selection.y + selection.height) <= (max.y + max.height) + eps
  )
}

function getCanvasBounds(canvas: CropperCanvasElement): CropperBounds {
  const rect = canvas.getBoundingClientRect()
  const width = rect.width || canvas.clientWidth || canvas.offsetWidth
  const height = rect.height || canvas.clientHeight || canvas.offsetHeight
  return {x: 0, y: 0, width, height}
}

function shouldUseCover(
  canvasWidth: number,
  canvasHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): boolean {
  if (naturalWidth <= 0 || naturalHeight <= 0 || canvasWidth <= 0 || canvasHeight <= 0) {
    return false
  }
  // 原图像素小于画布，contain 需放大 → 才用 cover；比例不一致的大图仍用 contain
  const containScale = Math.min(canvasWidth / naturalWidth, canvasHeight / naturalHeight)
  return containScale > 1
}

function isCoverBelowMinimum(
  image: CropperImageElement,
  canvas: CropperCanvasElement,
  matrix: number[],
): boolean {
  const canvasRect = canvas.getBoundingClientRect()
  const imageRect = getImageRectWithMatrix(image, canvas, matrix)
  return (
    imageRect.top > canvasRect.top
    || imageRect.right < canvasRect.right
    || imageRect.bottom < canvasRect.bottom
    || imageRect.left > canvasRect.left
  )
}

function shouldPreventImageTransform(
  image: CropperImageElement,
  canvas: CropperCanvasElement,
  matrix: number[],
  mode: ImageFitMode,
): boolean {
  return mode === 'cover' && isCoverBelowMinimum(image, canvas, matrix)
}

async function canvasToBlobResult(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<{blob: Blob; dataUrl: string} | null> {
  const dataUrl = canvas.toDataURL(mimeType, quality)
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality)
  })
  if (!blob) {
    return null
  }
  return {blob, dataUrl}
}

export function useCropperInstance() {
  const cropperHostRef = ref<HTMLElement>()
  const cropperCanvasRef = ref<CropperCanvasElement>()
  const cropperImageRef = ref<CropperImageElement>()
  const cropperSelectionRef = ref<CropperSelectionElement>()
  const ready = ref(false)
  const dragging = ref(false)
  const layoutInProgress = ref(false)

  let imageFitMode: ImageFitMode = 'contain'
  let onImageTransform: ((event: Event) => void) | null = null
  let dragMode: DragMode | null = null
  let dragPointerId: number | null = null
  let dragLastX = 0
  let dragLastY = 0
  let onDragPointerDown: ((event: Event) => void) | null = null
  let onDragPointerMove: ((event: Event) => void) | null = null
  let onDragPointerUp: ((event: Event) => void) | null = null
  let onAfterInteraction: (() => void) | null = null
  let boundDragHost: HTMLElement | null = null

  function getElements(): CropperElements | null {
    return resolveCropperElements(
      cropperHostRef,
      cropperCanvasRef,
      cropperImageRef,
      cropperSelectionRef,
    )
  }

  function setAfterInteraction(handler: (() => void) | null) {
    onAfterInteraction = handler
  }

  function endDrag() {
    dragMode = null
    dragPointerId = null
    dragging.value = false
  }

  function unbindDragInteraction() {
    endDrag()
    const host = boundDragHost
    const ownerDocument = host?.ownerDocument ?? document
    if (host && onDragPointerDown) {
      host.removeEventListener('pointerdown', onDragPointerDown, true)
    }
    if (onDragPointerMove) {
      ownerDocument.removeEventListener('pointermove', onDragPointerMove)
    }
    if (onDragPointerUp) {
      ownerDocument.removeEventListener('pointerup', onDragPointerUp)
      ownerDocument.removeEventListener('pointercancel', onDragPointerUp)
    }
    onDragPointerDown = null
    onDragPointerMove = null
    onDragPointerUp = null
    boundDragHost = null
  }

  function bindDragInteraction() {
    unbindDragInteraction()
    const elements = getElements()
    const host = cropperHostRef.value
    if (!elements || !host) {
      return
    }
    boundDragHost = host

    const ownerDocument = host.ownerDocument

    onDragPointerMove = (event: Event) => {
      if (dragMode == null || dragPointerId !== (event as PointerEvent).pointerId) {
        return
      }
      const pointerEvent = event as PointerEvent
      const dx = pointerEvent.pageX - dragLastX
      const dy = pointerEvent.pageY - dragLastY
      dragLastX = pointerEvent.pageX
      dragLastY = pointerEvent.pageY
      if (dx === 0 && dy === 0) {
        return
      }

      const elements = getElements()
      if (dragMode === 'image') {
        elements?.image.$move(dx, dy)
      } else if (dragMode === 'selection') {
        elements?.selection.$move(dx, dy)
      }
      pointerEvent.preventDefault()
    }

    onDragPointerUp = (event: Event) => {
      const pointerEvent = event as PointerEvent
      if (dragPointerId !== pointerEvent.pointerId) {
        return
      }
      const hadDrag = dragMode != null
      endDrag()
      if (hadDrag) {
        onAfterInteraction?.()
      }
    }

    onDragPointerDown = (event: Event) => {
      const pointerEvent = event as PointerEvent
      if (pointerEvent.button !== 0) {
        return
      }
      if (isResizeOrSelectAction(getHandleAction(pointerEvent.target))) {
        return
      }

      const elements = getElements()
      if (!elements) {
        return
      }

      const mode = resolveDragMode(
        pointerEvent.clientX,
        pointerEvent.clientY,
        elements.image,
        elements.selection,
      )
      if (!mode) {
        return
      }

      dragMode = mode
      dragPointerId = pointerEvent.pointerId
      dragLastX = pointerEvent.pageX
      dragLastY = pointerEvent.pageY
      dragging.value = true
      pointerEvent.preventDefault()
    }

    host.addEventListener('pointerdown', onDragPointerDown, true)
    ownerDocument.addEventListener('pointermove', onDragPointerMove)
    ownerDocument.addEventListener('pointerup', onDragPointerUp)
    ownerDocument.addEventListener('pointercancel', onDragPointerUp)
  }

  function unbindImageTransformGuard() {
    const image = cropperImageRef.value
    if (image && onImageTransform) {
      image.removeEventListener('transform', onImageTransform)
    }
    onImageTransform = null
  }

  function bindImageTransformGuard(mode: ImageFitMode) {
    unbindImageTransformGuard()
    imageFitMode = mode

    const elements = getElements()
    const {canvas, image} = elements ?? {}
    if (!canvas || !image) {
      return
    }

    onImageTransform = (event: Event) => {
      const matrix = (event as CustomEvent<{matrix: number[]}>).detail.matrix
      if (shouldPreventImageTransform(image, canvas, matrix, imageFitMode)) {
        event.preventDefault()
      }
    }
    image.addEventListener('transform', onImageTransform)
  }

  async function layout(aspectRatio?: number) {
    ready.value = false
    layoutInProgress.value = true
    unbindImageTransformGuard()
    unbindDragInteraction()

    try {
      const elements = await waitForCropperElements(
        cropperHostRef,
        cropperCanvasRef,
        cropperImageRef,
        cropperSelectionRef,
      )
      if (!elements) {
        return
      }

      const {canvas, image, selection} = elements
      cropperCanvasRef.value = canvas
      cropperImageRef.value = image
      cropperSelectionRef.value = selection

      const loadedImage = await image.$ready()

      const fixedRatio = aspectRatio != null && aspectRatio > 0
      selection.movable = true
      selection.resizable = !fixedRatio
      if (fixedRatio) {
        selection.aspectRatio = aspectRatio
        selection.initialAspectRatio = aspectRatio
      }

      selection.$reset()
      selection.$center()

      const canvasBounds = getCanvasBounds(canvas)
      const fitMode: ImageFitMode = shouldUseCover(
        canvasBounds.width,
        canvasBounds.height,
        loadedImage.naturalWidth,
        loadedImage.naturalHeight,
      )
        ? 'cover'
        : 'contain'

      image.$center(fitMode)
      bindImageTransformGuard(fitMode)
      bindDragInteraction()
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      if (selection.width <= 0 || selection.height <= 0) {
        selection.$center()
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve())
        })
      }
      ready.value = true
    } finally {
      layoutInProgress.value = false
    }
  }

  function onSelectionChange(event: Event) {
    if (layoutInProgress.value || dragging.value) {
      return
    }

    const elements = getElements()
    if (!elements) {
      return
    }

    const canvasBounds = getCanvasBounds(elements.canvas)
    if (canvasBounds.width <= 0 || canvasBounds.height <= 0) {
      return
    }

    const detail = (event as CustomEvent<CropperBounds>).detail
    if (isWithinBounds(detail, canvasBounds)) {
      return
    }

    event.preventDefault()
  }

  function applyAspectRatio(aspectRatio: number) {
    const selection = cropperSelectionRef.value
    if (!selection) {
      return
    }
    selection.aspectRatio = aspectRatio
    selection.initialAspectRatio = aspectRatio
    selection.$reset()
    selection.$center()
  }

  function relativeZoom(ratio: number) {
    cropperImageRef.value?.$zoom(ratio)
  }

  function move(x: number, y: number) {
    cropperImageRef.value?.$move(x, y)
  }

  function rotate(degree: number | string) {
    cropperImageRef.value?.$rotate(degree)
  }

  function reset(aspectRatio?: number) {
    cropperImageRef.value?.$resetTransform()
    cropperSelectionRef.value?.$reset()
    void layout(aspectRatio)
  }

  async function cropToBlob(options: CropToBlobOptions): Promise<CropToBlobResult | null> {
    const results = await cropToOutputs([{scale: 1}], options)
    const first = results[0]
    if (!first) {
      return null
    }
    return {blob: first.blob, dataUrl: first.dataUrl}
  }

  async function cropToOutputs(
    scales: CropperOutputScale[],
    options: CropToBlobOptions,
  ): Promise<CropperOutputResult[]> {
    if (dragging.value) {
      return []
    }

    const elements = getElements()
    const selection = elements?.selection
    if (!selection || scales.length === 0 || !isSelectionReady(selection)) {
      return []
    }

    const sourceWidth = Math.max(1, Math.round(selection.width))
    const sourceHeight = Math.max(1, Math.round(selection.height))

    let baseCanvas: HTMLCanvasElement
    try {
      baseCanvas = await selection.$toCanvas({
        width: sourceWidth,
        height: sourceHeight,
      })
    } catch {
      return []
    }

    const baseWidth = baseCanvas.width
    const baseHeight = baseCanvas.height
    if (baseWidth <= 0 || baseHeight <= 0) {
      return []
    }
    const results: CropperOutputResult[] = []

    for (const item of scales) {
      const width = Math.max(1, Math.round(baseWidth * item.scale))
      const height = Math.max(1, Math.round(baseHeight * item.scale))
      const quality = item.quality ?? options.quality
      let canvas = baseCanvas
      if (item.scale !== 1) {
        try {
          canvas = await selection.$toCanvas({width, height})
        } catch {
          continue
        }
      }
      const encoded = await canvasToBlobResult(canvas, options.mimeType, quality)
      if (!encoded) {
        continue
      }
      results.push({
        scale: item.scale,
        width,
        height,
        blob: encoded.blob,
        dataUrl: encoded.dataUrl,
        suffix: item.suffix,
      })
    }

    return results
  }

  onBeforeUnmount(() => {
    unbindImageTransformGuard()
    unbindDragInteraction()
  })

  return {
    cropperHostRef,
    cropperCanvasRef,
    cropperImageRef,
    cropperSelectionRef,
    ready,
    dragging,
    layoutInProgress,
    layout,
    onSelectionChange,
    applyAspectRatio,
    relativeZoom,
    move,
    rotate,
    reset,
    cropToBlob,
    cropToOutputs,
    setAfterInteraction,
    isSelectionReady,
    resolveCropperElements: getElements,
  }
}
