import type {BasicIdMetadata, SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {CrudPageDefinition} from './types'

/**
 * 声明一个 CRUD 页面。
 *
 * 它是**恒等函数**：原样返回传入的对象，运行时不做任何事。
 * 存在的唯一目的是用类型约束声明（写错 key 编辑器报红）。
 *
 * 实体类型无法从 `service` 可靠推断，所以实体字段级别的检查需要显式写类型参数：
 * `defineCrudPage<RoleSavePayload, RoleEntity>({...})`
 */
export function defineCrudPage<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(page: CrudPageDefinition<TBody, TEntity, TId>): CrudPageDefinition<TBody, TEntity, TId> {
  return page
}
