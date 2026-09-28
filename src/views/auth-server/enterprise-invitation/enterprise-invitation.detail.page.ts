import {defineDetailPage} from '@loncra/antdv-pro'
import {
  enterpriseInvitationCore,
  expirationCell,
  roleNamesCell,
} from './enterprise-invitation.page'

/** `a-descriptions` 的响应式列数（照抄旧 `Detail.vue`） */
const COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}

/**
 * 企业邀请详情（`Detail.vue`）。核心在 `enterprise-invitation.page.ts`，这里只写详情形态。
 *
 * 三处照旧：
 * - `member`（头像 + 显示名）/ `roles`（角色名逗号分隔）/ `expirationTime`（空 = 永久）三个显示
 *   直接复用核心的单元格函数（与列表**同一份**，不重写）；
 * - `status` / `auditType` 是 `format: 'enum'`（值自带 `{name, value}` 时取名称，等价旧代码的
 *   `getEnumName(...)`），label 与枚举来源也写在核心字典里；
 * - `creationTime` 用 `format: 'dateTime'`（与旧 `dateTimeFormat(entity.creationTime)` 同源）。
 */
export const enterpriseInvitationDetailPage = defineDetailPage(enterpriseInvitationCore, {
  column: COLUMN,
  fields: [
    'id',
    // 邀请人（头像 + 名称，本人那行带「(我)」）来自核心字典的 `format: {name: 'principalName', args: {self: true}}`
    'member',
    'status',
    {
      key: 'roles',
      render: roleNamesCell
    },
    'expirationTime',
    'auditType',
    'creationTime',
    'tenantId',
  ],
})
