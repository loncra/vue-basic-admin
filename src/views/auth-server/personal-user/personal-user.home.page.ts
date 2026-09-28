import type {PersonalUserEntity} from '@loncra/client/auth'
import {defineHomePage} from '@loncra/antdv-pro'
import {defineSearchProps} from '@/utils'
import {AUTH_SERVER_PERSONAL_USER_AUTHORITY} from '@/constants'
import {personalUserCore} from './personal-user.page'

/**
 * 个人用户列表（`Home.vue`）。核心在 `personal-user.page.ts`，这里只写列表形态。
 *
 * 照抄旧 `PersonalUserTable.vue` 的 7 列（连每列的搜索组件与表达式一起）：
 * - `phone_number` / `last_authentication_time` 这两个查询名由 pro 按字段名自动转蛇形得来，
 *   与旧表手写的 key 一致（旧表是 `dataIndex: 'phoneNumber'` + `key: 'phone_number'` 拆开写的）；
 * - 性别 / 状态的 `format: 'enum'` + `enumRef` 在核心字典里（旧表是 `applyColumnOptions` 手动喂）；
 * - 时间列的 `format: 'dateTime'` 也在核心字典里（旧表是 `bodyCell` 里 `dateTimeFormat`）；
 * - 旧表的 `preview`（"只读嵌入"开关）**没有任何地方用** ⇒ 不搬（YAGNI）。
 *
 * 行内动作不声明：默认动作按 `authority` 出，这里只有 `detail` ⇒ 只剩「详情」，
 * 跳转由 `routes.detail` + `CrudConfig.onNavigate` 兜底（旧表 `@detail` 就是跳它）。
 */
export const personalUserHomePage = defineHomePage<PersonalUserEntity>(personalUserCore, {
  authority: {detail: AUTH_SERVER_PERSONAL_USER_AUTHORITY.GET},
  rowSelection: {fixed: true, type: 'checkbox'},
  columns: [
    // 头像 + 名称（本人那行带「(我)」）：宿主注册的 `principalName` formatter
    // （`nickname` 可选，formatter 会从整条记录取"人"）
    {key: 'nickname', width: 150, ellipsis: true, format: {name: 'principalName', args: {self: true}}, search: defineSearchProps('input')},
    {key: 'gender', width: 150, ellipsis: true, search: defineSearchProps('select')},
    {key: 'username', width: 300, ellipsis: true, search: defineSearchProps('input')},
    {key: 'status', width: 150, ellipsis: true, search: defineSearchProps('select')},
    {
      key: 'email',
      width: 150,
      ellipsis: true,
      search: defineSearchProps('input', {expression: 'eq'}),
    },
    {
      key: 'phoneNumber',
      width: 150,
      ellipsis: true,
      search: defineSearchProps('number', {expression: 'eq'}),
    },
    {
      key: 'lastAuthenticationTime',
      width: 210,
      search: defineSearchProps('dateRange', {expression: 'between'}),
    },
  ],
})
