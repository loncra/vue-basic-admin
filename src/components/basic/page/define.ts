import type {BasicIdMetadata, SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {
  CrudDetailDefinition,
  CrudFormDefinition,
  CrudHomeDefinition,
  CrudPageCore,
  PageDetailDefinition,
  PageFormDefinition,
  PageListDefinition,
} from './types'

/**
 * 声明页面的三个入口：`defineHomePage` / `defineFormPage` / `defineDetailPage`。
 *
 * 分工：
 * - **核心**（`CrudPageCore`：service / detailService / rowKey / i18nPrefix / routes /
 *   operationDataTraceTarget / fields 字典）写在页面的 `xxx.page.ts` 里，三种形态共用一份；
 * - **形态文件**（`xxx.home.page.ts` / `xxx.form.page.ts` / `xxx.detail.page.ts`）只写自己那部分；
 * - 三个函数把两者合起来，返回对应壳（`CrudHomePage` / `CrudFormPage` / `CrudDetailPage`）
 *   能直接吃的完整对象 —— 所以**页面壳不用知道拆过**，照旧 `:page="xxxHomePage"`。
 *
 * 三个函数都是恒等合并（`{...core, list}`），运行时不做任何解析；存在的目的是用类型约束声明
 * （写错 key 编辑器报红）。
 *
 * 实体类型无法从 `service` 可靠推断，所以字段级检查需要显式写类型参数：
 * `defineFormPage<RoleSavePayload, RoleEntity>(roleCore, {...})`
 */

export function defineHomePage<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  core: CrudPageCore<TBody, TEntity, TId>,
  list: PageListDefinition<TEntity>,
): CrudHomeDefinition<TBody, TEntity, TId> {
  return {...core, list}
}

export function defineFormPage<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  core: CrudPageCore<TBody, TEntity, TId>,
  form: PageFormDefinition<TBody, TEntity>,
): CrudFormDefinition<TBody, TEntity, TId> {
  return {...core, form}
}

export function defineDetailPage<
  TBody extends BasicIdMetadata<TId>,
  TEntity extends TBody = TBody,
  TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME],
>(
  core: CrudPageCore<TBody, TEntity, TId>,
  detail: PageDetailDefinition<TEntity>,
): CrudDetailDefinition<TBody, TEntity, TId> {
  return {...core, detail}
}
