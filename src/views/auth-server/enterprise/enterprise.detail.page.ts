import {defineDetailPage} from '@loncra/antdv-pro'
import {enterpriseCore} from './enterprise.page'

/** `a-descriptions` 的响应式列数（照抄旧页面 `Detail.vue`） */
const COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}

/**
 * 企业详情（`Detail.vue`）。核心在 `enterprise.page.ts`，这里只写详情形态。
 *
 * 两处照旧：
 * - `name` 在旧页面是"图标 + 名称"（手写的 `<l-icon-select preview>` 套 `a-space`，`size="large"`）
 *   ⇒ 用宿主注册的 `iconName` formatter，尺寸从声明里传（`args.size`）；图标怎么画由宿主注入
 *   `renderIconFont`（见 `@/utils/crudFormatters`）；
 * - 两个时间用 `format: 'dateTime'`（与旧 `useDateFormat().dateTimeFormat` 同源）；
 *   `enabled` 的 `format: 'enum'` 写在核心字典里（与列表共用）。
 *
 * 其余几项（`id` / `ownerPrincipal` / `tenantId` / `remark`）旧页面就是直接输出，空值显示空串
 * —— pro 的详情对 `null` / `undefined` 也是空串，行为一致。
 */
export const enterpriseDetailPage = defineDetailPage(enterpriseCore, {
  column: COLUMN,
  fields: [
    'id',
    {key: 'name', format: {name: 'iconName', args: {size: 'large'}}},
    'ownerPrincipal',
    'enabled',
    'tenantId',
    'remark',
    'disbandTime',
    'creationTime',
  ],
})
