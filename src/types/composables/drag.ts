import type {Ref} from 'vue'
import type {FlatSortMetadata} from '@/types/apis'
import {SYSTEM_CONSTANT} from '@/constants/systemConstant.ts'


/** 树形表格拖拽放置位置：目标行上 / 中 / 下 */
export type DropPosition = -1 | 0 | 1

export interface UseDragOptions<
  TEntity extends object
> {
  drag: Ref<boolean>
  idKey?: string
  formatDragPreview?: (record: TEntity) => string
}

export interface UseDragReturn<
  TEntity extends object,
  TId = TEntity extends Record<typeof SYSTEM_CONSTANT.ID_NAME, infer K> ? K : never,
> {
  dragKey: Ref<TId | undefined>
  entityId: (record: TEntity) => TId
  onDragHandleStart: (record: TEntity, event: DragEvent) => void
  onDragHandleEnd: () => void
  removeDragGhost: () => void
  clearDragKey: () => void
}

export interface UseFlatDragDropOptions<
  TEntity extends object,
  TId = TEntity extends Record<typeof SYSTEM_CONSTANT.ID_NAME, infer K> ? K : never,
> extends UseDragOptions<TEntity> {
  dataSource: Ref<TEntity[]>
  /** 拖拽放置指示方向：vertical 为上下边框，horizontal 为左右边框 */
  direction?: 'vertical' | 'horizontal'
  onFlatDrop?: (payload: {
    sorts: FlatSortMetadata<TId>[]
    target: TEntity
    fromIndex: number
    toIndex: number
  }) => void
}

export interface UseFlatDragDropReturn<TEntity extends object> {
  buildDropZoneProps: (record: TEntity) => {
    onDragover: (event: DragEvent) => void
    onDrop: () => void
  }
  dropTargetClass: (record: TEntity) => string | undefined
  clearDropState: () => void
}
