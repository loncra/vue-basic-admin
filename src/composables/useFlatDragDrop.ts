import {ref} from 'vue'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import type {TreeSortMetadata} from '@/types/apis'
import type {
  UseDragReturn,
  UseFlatDragDropOptions,
  UseFlatDragDropReturn,
} from '@/types/composables/drag'
import {useDrag} from '@/composables/usrDrag.ts'
import {
  buildFlatPlacementMap,
  buildTreeSortMetadata,
  diffTreePlacementIds,
} from '@/utils/treeUtils'

const DRAG_DROP_CLASS = {
  vertical: {
    before: 'drag-card-before',
    after: 'drag-card-after',
  },
  horizontal: {
    before: 'drag-card-left',
    after: 'drag-card-right',
  },
} as const

export function reorderFlatList<
  TEntity extends object,
  TId = TEntity extends Record<typeof SYSTEM_CONSTANT.ID_NAME, infer K> ? K : never,
>(
  list: TEntity[],
  dragId: TId,
  targetId: TId,
  idKey: string = SYSTEM_CONSTANT.ID_NAME,
): {
  newList: TEntity[]
  fromIndex: number
  toIndex: number
  sorts: TreeSortMetadata<TId>[]
} | null {
  type EntityRecord = TEntity & Record<string, unknown>
  const getId = (record: TEntity) => (record as EntityRecord)[idKey] as TId

  const current = [...list]
  const fromIndex = current.findIndex((item) => getId(item) === dragId)
  const toIndex = current.findIndex((item) => getId(item) === targetId)
  if (fromIndex === -1 || toIndex === -1) {
    return null
  }

  const placementBefore = buildFlatPlacementMap(current, idKey)
  const [moved] = current.splice(fromIndex, 1)
  current.splice(toIndex, 0, moved!)
  const placementAfter = buildFlatPlacementMap(current, idKey)
  const changedIds = diffTreePlacementIds(placementBefore, placementAfter)
  const sorts =
    changedIds.length > 0
      ? (buildTreeSortMetadata(placementAfter, changedIds) as TreeSortMetadata<TId>[])
      : []

  return {newList: current, fromIndex, toIndex, sorts}
}

export function useFlatDragDrop<
  TEntity extends object,
  TId = TEntity extends Record<typeof SYSTEM_CONSTANT.ID_NAME, infer K> ? K : never,
>(
  options: UseFlatDragDropOptions<TEntity, TId>,
): UseFlatDragDropReturn<TEntity> & UseDragReturn<TEntity, TId> {
  const {
    dragKey,
    entityId,
    onDragHandleStart,
    removeDragGhost,
    clearDragKey,
  } = useDrag<TEntity, TId>(options)

  const hoverTargetKey = ref<TId | undefined>()
  const dropPosition = ref<-1 | 1 | undefined>()

  function clearDropState() {
    hoverTargetKey.value = undefined
    dropPosition.value = undefined
    clearDragKey()
  }

  function handleFlatDrop(target: TEntity) {
    const currentDragKey = dragKey.value
    if (!currentDragKey || currentDragKey === entityId(target)) {
      clearDropState()
      return
    }

    const result = reorderFlatList(
      options.dataSource.value,
      currentDragKey,
      entityId(target),
      options.idKey,
    )
    if (!result) {
      clearDropState()
      return
    }

    options.dataSource.value = result.newList
    clearDropState()
    options.onFlatDrop?.({
      sorts: result.sorts as TreeSortMetadata<TId>[],
      target,
      fromIndex: result.fromIndex,
      toIndex: result.toIndex,
    })
  }

  const direction = options.direction ?? 'vertical'
  const dropClass = DRAG_DROP_CLASS[direction]

  function resolveDropPosition(event: DragEvent): -1 | 1 {
    const el = event.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    if (direction === 'horizontal') {
      const ratio = (event.clientX - rect.left) / rect.width
      return ratio < 0.5 ? -1 : 1
    }
    const ratio = (event.clientY - rect.top) / rect.height
    return ratio < 0.5 ? -1 : 1
  }

  function buildDropZoneProps(record: TEntity) {
    return {
      onDragover: (event: DragEvent) => {
        if (!options.drag.value) {
          return
        }
        event.preventDefault()
        hoverTargetKey.value = entityId(record)
        dropPosition.value = resolveDropPosition(event)
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = 'move'
        }
      },
      onDrop: () => {
        if (!options.drag.value) {
          return
        }
        handleFlatDrop(record)
      },
    }
  }

  function dropTargetClass(record: TEntity): string | undefined {
    if (hoverTargetKey.value !== entityId(record)) {
      return undefined
    }
    if (dropPosition.value === -1) {
      return dropClass.before
    }
    if (dropPosition.value === 1) {
      return dropClass.after
    }
    return undefined
  }

  function onDragHandleEnd() {
    removeDragGhost()
    clearDropState()
  }

  return {
    dragKey,
    entityId,
    onDragHandleStart,
    onDragHandleEnd,
    removeDragGhost,
    clearDragKey,
    buildDropZoneProps,
    dropTargetClass,
    clearDropState,
  }
}
