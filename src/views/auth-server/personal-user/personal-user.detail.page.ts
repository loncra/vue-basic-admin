import {defineDetailPage} from '@loncra/antdv-pro'
import {personalUserCore} from './personal-user.page'

/** `a-descriptions` 的响应式列数（照抄旧页面 `Detail.vue`） */
const COLUMN = {xxxl: 4, xxl: 4, xl: 4, lg: 2, md: 2, sm: 1, xs: 1}

/**
 * 个人用户详情（`Detail.vue`）。核心在 `personal-user.page.ts`，这里只写详情形态。
 *
 * 三个说明：
 * - 枚举一律 `format: 'enum'`（**不手写 `render`**）：`registry.ts` 的 `enum` formatter 就是
 *   `getEnumName(value)`，与旧页面一字不差；`gender` / `status` 的 `format` 写在核心字典里，
 *   嵌套路径那两项在自己的条目上写；
 * - `initialization.*` 是**嵌套路径**：值从路径取，标签必须自己给 `labelKey`（字典按字段名索引）；
 * - `lastAuthenticationTime` 用 `format: 'dateTime'`（pro 的格式串来自宿主注入的 `CrudConfig`，
 *   与旧页面的 `useDateFormat().dateTimeFormat` 同一个来源）。
 */
export const personalUserDetailPage = defineDetailPage(personalUserCore, {
  column: COLUMN,
  fields: [
    'id',
    'nickname',
    'username',
    'email',
    'phoneNumber',
    'gender',
    'status',
    'lastAuthenticationTime',
    {
      key: 'initialization.randomPassword',
      labelKey: 'authServer.randomPassword',
      format: 'enum',
    },
    {
      key: 'initialization.randomUsername',
      labelKey: 'authServer.randomUsername',
      format: 'enum',
    },
    'promoCode',
    'tenantId',
  ],
})
