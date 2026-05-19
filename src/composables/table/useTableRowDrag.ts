import {computed, ref} from 'vue'
import type {TableProps} from 'antdv-next'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'
import type {TreeSortMetadata} from '@/types/apis'
import type {
  SearchableColumnType,
  UseTableRowDragOptions,
  UseTableRowDragReturn,
} from '@/types/composables/table'
import {
  buildFlatPlacementMap,
  buildTreePlacementMap,
  buildTreeSortMetadata,
  diffTreePlacementIds,
  findFirstTreeNode,
  isTree,
  isTreeDescendant,
  moveTreeNode,
  type TreeDropPosition,
  type TreePlacement,
} from '@/utils/treeUtils'

const DRAG_ROW_CLASS = {
  invalid: 'drag-row-invalid',
  before: 'drag-row-before',
  after: 'drag-row-after',
  inner: 'drag-row-inner',
} as const

type RowClassValue = string | Record<string, boolean> | Array<string | Record<string, boolean>>

export function useTableRowDrag<
  TEntity extends object,
  TId = TEntity extends Record<typeof SYSTEM_CONSTANT.ID_NAME, infer K> ? K : never,
>(options: UseTableRowDragOptions<TEntity, TId>): UseTableRowDragReturn<TEntity> {
  type EntityRecord = TEntity & Record<string, unknown>
  const idKey = options.idKey ?? SYSTEM_CONSTANT.ID_NAME

  const dragKey = ref<TId | undefined>()
  const hoverTargetKey = ref<TId | undefined>()
  const dropInvalid = ref<boolean>()
  const dropPosition = ref<TreeDropPosition>()
  const lastPlacement = ref(new Map<number, TreePlacement>())

  let dragGhostEl: HTMLElement | null = null

  function clearDragState() {
    dragKey.value = undefined
    hoverTargetKey.value = undefined
    dropPosition.value = undefined
    dropInvalid.value = undefined
  }

  function entityId(record: TEntity): TId {
    return (record as EntityRecord)[idKey] as TId
  }

  function removeDragGhost() {
    dragGhostEl?.remove()
    dragGhostEl = null
  }

  function syncPlacementBaseline(tree: TEntity[] = options.dataSource.value) {
    if (!options.drag.value) {
      return
    }
    if (tree.length === 0) {
      lastPlacement.value = new Map()
      return
    }
    if (!isTree(tree)) {
      return
    }
    lastPlacement.value = buildTreePlacementMap(tree, idKey)
  }

  function isInvalidTreeDrop(dragId: TId, target: TEntity): boolean {
    if (dragId === entityId(target)) {
      return true
    }
    if (!isTree(options.dataSource.value)) {
      return false
    }
    return isTreeDescendant(dragId, entityId(target), options.dataSource.value, idKey)
  }

  function resolveDropPosition(event: DragEvent, treeMode: boolean): TreeDropPosition {
    const el = event.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    const ratio = (event.clientY - rect.top) / rect.height
    if (!treeMode) {
      return ratio < 0.5 ? -1 : 1
    }
    if (ratio < 0.25) {
      return -1
    }
    if (ratio > 0.75) {
      return 1
    }
    return 0
  }

  function mergeRowClass(
    parentClass: RowClassValue | undefined,
    dragClass: string | undefined,
  ): RowClassValue | undefined {
    if (!dragClass) {
      return parentClass
    }
    if (!parentClass) {
      return dragClass
    }
    if (typeof parentClass === 'string') {
      return `${parentClass} ${dragClass}`
    }
    if (Array.isArray(parentClass)) {
      return [...parentClass, dragClass]
    }
    return {...parentClass, [dragClass]: true}
  }

  function dragRowClass(record: TEntity): string | undefined {
    if (hoverTargetKey.value !== entityId(record)) {
      return undefined
    }
    if (dropInvalid.value) {
      return DRAG_ROW_CLASS.invalid
    }
    const pos = dropPosition.value
    if (pos === -1) {
      return DRAG_ROW_CLASS.before
    }
    if (pos === 1) {
      return DRAG_ROW_CLASS.after
    }
    if (pos === 0 && isTree(options.dataSource.value)) {
      return DRAG_ROW_CLASS.inner
    }
    return undefined
  }

  function handleFlatRowDrop(target: TEntity, dragId: TId) {
    const current = [...options.dataSource.value]
    const fromIndex = current.findIndex((item) => entityId(item) === dragId)
    const toIndex = current.findIndex((item) => entityId(item) === entityId(target))
    if (fromIndex === -1 || toIndex === -1) {
      clearDragState()
      return
    }

    const placementBefore = buildFlatPlacementMap(current, idKey)
    const [moved] = current.splice(fromIndex, 1)
    current.splice(toIndex, 0, moved!)
    options.dataSource.value = current

    const placementAfter = buildFlatPlacementMap(current, idKey)
    const changedIds = diffTreePlacementIds(placementBefore, placementAfter)
    const sorts =
      changedIds.length > 0
        ? (buildTreeSortMetadata(placementAfter, changedIds) as TreeSortMetadata<TId>[])
        : []

    clearDragState()
    options.onFlatDrop?.({sorts, target, fromIndex, toIndex})
  }

  function handleTreeRowDrop(target: TEntity, dragId: TId) {
    const pos = dropPosition.value ?? 0
    const dragRecord = findFirstTreeNode(
      (n) => entityId(n as TEntity) === dragId,
      options.dataSource.value,
    ) as TEntity | undefined

    const newTree = moveTreeNode(
      options.dataSource.value,
      dragId,
      entityId(target),
      pos,
      idKey,
    ) as TEntity[] | null

    if (!newTree || !dragRecord) {
      clearDragState()
      return
    }

    const placementBefore = new Map(lastPlacement.value)
    const placementAfter = buildTreePlacementMap(newTree, idKey)
    const changedIds = diffTreePlacementIds(placementBefore, placementAfter)
    const sorts =
      changedIds.length > 0
        ? (buildTreeSortMetadata(placementAfter, changedIds) as TreeSortMetadata<TId>[])
        : []

    options.dataSource.value = newTree
    clearDragState()
    lastPlacement.value = placementAfter

    options.onTreeDrop?.({
      sorts,
      drag: dragRecord,
      target,
      dropPosition: pos,
      tree: newTree,
    })
  }

  function buildDragRowProps(record: TEntity) {
    return {
      onDragover: (event: DragEvent) => {
        if (!options.drag.value) {
          return
        }
        event.preventDefault()
        const treeMode = isTree(options.dataSource.value)
        hoverTargetKey.value = entityId(record)
        dropPosition.value = resolveDropPosition(event, treeMode)
        dropInvalid.value =
          dragKey.value != null ? isInvalidTreeDrop(dragKey.value as TId, record) : false
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = dropInvalid.value ? 'none' : 'move'
        }
      },
      onDrop: () => {
        if (!options.drag.value) {
          return
        }
        const currentDragKey = dragKey.value
        if (!currentDragKey || currentDragKey === entityId(record)) {
          clearDragState()
          return
        }
        if (dropInvalid.value) {
          clearDragState()
          return
        }
        if (isTree(options.dataSource.value)) {
          handleTreeRowDrop(record, currentDragKey as TId)
        } else {
          handleFlatRowDrop(record, currentDragKey as TId)
        }
      },
    }
  }

  function resolveOnRow(
    record: Parameters<NonNullable<TableProps['onRow']>>[0],
    index?: number,
  ) {
    const parentOnRow = options.onRow?.value
    const parentProps =
      typeof parentOnRow === 'function' ? parentOnRow(record, index) ?? {} : {}

    if (!options.drag.value) {
      return parentProps
    }

    const entity = record as TEntity
    return {
      ...parentProps,
      ...buildDragRowProps(entity),
      class: mergeRowClass(parentProps.class as RowClassValue | undefined, dragRowClass(entity)),
    }
  }

  const tableOnRow = computed((): TableProps['onRow'] | undefined => {
    if (!options.drag.value && !options.onRow?.value) {
      return undefined
    }
    return resolveOnRow
  })

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
    clearDragState()
  }

  function applyDragColumn(columns: SearchableColumnType[]) {
    if (!options.drag.value) {
      return columns
    }
    return [{title: '', key: 'drag', width: 40}, ...columns]
  }

  const isDragCell = (column: {key?: string | number}) =>
    Boolean(options.drag.value && column.key === 'drag')

  return {
    tableOnRow,
    applyDragColumn,
    isDragCell,
    onDragHandleStart,
    onDragHandleEnd,
    syncPlacementBaseline,
  }
}
