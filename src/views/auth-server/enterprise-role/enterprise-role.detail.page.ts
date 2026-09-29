import {defineDetailPage} from '@loncra/antdv-pro'
import {enterpriseRoleCore} from './enterprise-role.page'

/** `a-descriptions` 的响应式列数（照抄旧 `Detail.vue`） */
const COLUMN = {xxxl: 3, xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1}

/**
 * 企业角色详情（`Detail.vue`）。核心在 `enterprise-role.page.ts`，这里只写详情形态。
 *
 * 三处照旧：
 * - 三个 v1 字段用 `format: 'enum'`（等价旧代码的 `getEnumName(...)`），label 与枚举来源在核心字典里；
 * - `remark` 跨 2 列（旧 `:span="2"`）；
 * - 「独立资源」那张表不是字段，是**宿主自己的组件**（`LResourceTable`，数据来自
 *   `resourceService.findEnterprise({})`）⇒ 留在页壳的 `#afterDescriptions` 里（旧 `BasicDetail`
 *   的同名插槽，位置一模一样），不硬塞进字段 DSL。
 */
export const enterpriseRoleDetailPage = defineDetailPage(enterpriseRoleCore, {
  column: COLUMN,
  fields: ['id', 'name', 'authority', 'modifiable', 'removable', 'enabled', {key: 'remark', span: 'filled'}],
})
