import type {Ref} from 'vue'
import type {BasicCrudService, BasicIdMetadata, RestResult} from '@/types/apis'
import type {ActionTranslateFn} from '@/composables/action/defaultToolbarActions.ts'

export interface ConfirmModalLike {
  confirm: (options: {title: string; content: string; onOk: () => void | Promise<void>}) => void
}

export interface MessageLike {
  success: (content: string) => void
  error: (content: string) => void
}

export interface UseCrudDeleteOptions<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TId,
> {
  service: unknown
  t: ActionTranslateFn
  modal: ConfirmModalLike
  message: MessageLike
  refresh: () => Promise<void> | void
  onDeleted?: (records: TEntity[]) => void | Promise<void>
  loading?: Ref<boolean>
}

export function useCrudDelete<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody,
  TId,
>(options: UseCrudDeleteOptions<TBody, TEntity, TId>) {
  function remove(records: TEntity[]) {
    if (records.length === 0) {
      return
    }
    const content =
      records.length === 1
        ? options.t('common.delete.confirmSingle')
        : options.t('common.delete.confirmBatch', {count: records.length})
    options.modal.confirm({
      title: options.t('common.delete.confirmTitle'),
      content,
      onOk: () => doDelete(records),
    })
  }

  async function doDelete(records: TEntity[]) {
    if (typeof (options.service as BasicCrudService<TBody, TEntity, TId>).delete !== 'function') {
      return
    }
    try {
      const result: RestResult<void> = await (
        options.service as BasicCrudService<TBody, TEntity, TId>
      ).delete(records.map((r) => r.id))
      options.message.success(result.message)
      await options.onDeleted?.(records)
      await options.refresh()
    } catch (e) {
      options.message.error(e instanceof Error ? e.message : String(e))
    } finally {
      if (options.loading) {
        options.loading.value = false
      }
    }
  }

  return {remove, doDelete}
}
