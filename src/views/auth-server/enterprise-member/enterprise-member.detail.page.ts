import {defineDetailPage} from '@loncra/antdv-pro'
import {enterpriseMemberCore} from './enterprise-member.page'

/** `a-descriptions` 的响应式列数（照抄旧 `Detail.vue` 的 `:column`） */
const COLUMN = {xxxl: 3, xxl: 3, xl: 3, lg: 3, md: 1, sm: 1, xs: 1}

/**
 * 企业成员详情（`Detail.vue`）。核心在 `enterprise-member.page.ts`，这里只写详情形态。
 *
 * 三处照旧：
 * - 「姓名」是 **`nickname`**（旧页 `{{entity.nickname || ''}}`）—— 列表列用的是 `realName`
 *   （头像 + 名称的 `principalName` formatter 从整条记录取"人"），两个 key 同一句 label；
 * - `role` / `status` / `gender` 走 `format: 'enum'`（值自带 `{name, value}` ⇒ 等价旧代码的
 *   `getEnumName(...)`），label 与枚举来源都在核心字典里；
 * - ⚠️ **`auditStatus` 在这里覆盖成 `'enum'`**：核心字典里它是「状态点 + 名称」（列表用），
 *   而旧详情页是**纯文本** `getEnumName(entity.auditStatus)` ⇒ 照搬现状，不换成状态点。
 *
 * 「角色表 / 独立资源」那两张表**不是字段**（要 `roleIds` / `resourceIds` 的勾选回写）
 * ⇒ 留在页壳的 `#afterDescriptions` 插槽里（旧 `BasicDetail` 的同名插槽，位置一模一样）；
 * 保存按钮在 `#afterOperationDataTrace`（同样照旧）。
 */
export const enterpriseMemberDetailPage = defineDetailPage(enterpriseMemberCore, {
  column: COLUMN,
  fields: [
    'nickname',
    'username',
    'principal',
    'role',
    {key: 'auditStatus', format: 'enum'},
    'status',
    'gender',
    'phoneNumber',
    'lastAuthenticationTime',
  ],
})
