import {ref} from 'vue'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import type {UseDragOptions, UseDragReturn} from '@/types/composables/drag'

export function useDrag<
  TEntity extends object,
  TId = TEntity extends Record<typeof SYSTEM_CONSTANT.ID_NAME, infer K> ? K : never,
>(options: UseDragOptions<TEntity>): UseDragReturn<TEntity, TId> {
  type EntityRecord = TEntity & Record<string, unknown>
  const idKey = options.idKey ?? SYSTEM_CONSTANT.ID_NAME

  const dragKey = ref<TId | undefined>()
  let dragGhostEl: HTMLElement | null = null

  function entityId(record: TEntity): TId {
    return (record as EntityRecord)[idKey] as TId
  }

  function removeDragGhost() {
    dragGhostEl?.remove()
    dragGhostEl = null
  }

  function clearDragKey() {
    dragKey.value = undefined
  }

  function onDragHandleStart(record: TEntity, event: DragEvent) {
    if (!options.drag.value) {
      return
    }
    const id = entityId(record)
    dragKey.value = id
    event.dataTransfer?.setData('text/plain', String(id))

    removeDragGhost()
    const label = options.formatDragPreview?.(record) ?? String(id)
    const ghost = document.createElement('div')
    ghost.className = 'drag-ghost'
    ghost.textContent = label
    const root = document.querySelector('.ant-app') ?? document.body
    root.appendChild(ghost)
    dragGhostEl = ghost
    event.dataTransfer?.setDragImage(ghost, 12, 12)
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
    }
  }

  function onDragHandleEnd() {
    removeDragGhost()
    clearDragKey()
  }

  return {
    dragKey,
    entityId,
    onDragHandleStart,
    onDragHandleEnd,
    removeDragGhost,
    clearDragKey,
  }
}
