import dayjs from 'dayjs'
import type {AuditEventEntity} from '@loncra/client/auth'
import {defineHomePage} from '@loncra/antdv-pro'
import {defineSearchProps} from '@/utils'
import i18n from '@/i18n'
import {authenticationCore} from './authentication.page'

/**
 * 认证事件列表（`AuthenticationHome.vue`）。核心在 `authentication.page.ts`，这里只写列表形态。
 *
 * - `ip` / `deviceIdentified` / `system` 的数据不在顶层字段，在 `data.details.requestDetails.*`
 *   ⇒ 列 key 直接写**路径**（pro 按 `readPath` 取值，不需要 `render`，也不需要新 formatter）；
 *   路径不是实体字段 ⇒ `labelKey` 只能留在列上。
 * - `type` 的显示来自 `data.details.requestDetails.type`，而后端查询键仍是 `type`
 *   ⇒ 搜索显式写 `queryName`（路径默认会拼成 `filter_[data..._eq]`，与旧页面不一致）。
 */
export const authenticationHomePage = defineHomePage<AuditEventEntity, AuditEventEntity>(
  authenticationCore,
  {
    authority: {detail: 'perms[auth_server_audit_event:get]'},
    columns: [
      {
        key: 'timestamp',
        width: 210,
        format: 'dateTime',
        // 不用 defineSearchProps('date')：它的 placeholder 写死是 'search.placeholder.date'，
        // 旧页面用的是 'search.placeholder.input'；要跟随语言，props 必须是函数形态
        search: {
          component: 'date',
          queryName: 'after',
          defaultValue: dayjs().startOf('d'),
          props: () => ({
            allowClear: false,
            class: 'w-full',
            showTime: true,
            placeholder: i18n.global.t('search.placeholder.input'),
          }),
        },
      },
      {
        key: 'principal',
        width: 150,
        render: (_value, record) => record.data?.details?.metadata?.realName || record.principal,
        search: defineSearchProps('input', {
          queryName: 'filter_[principal_eq]_or_[data.details.metadata.realName_eq]',
        }),
      },
      {
        key: 'data.details.requestDetails.requestHeaders.x-device-identified',
        labelKey: 'authServer.deviceIdentified',
        width: 300,
      },
      {
        key: 'data.details.requestDetails.remoteAddress',
        labelKey: 'common.ip',
        width: 250,
        search: defineSearchProps('input', {
          queryName: 'filter_[data.details.requestDetails.remoteAddress_eq]',
        }),
      },
      {
        key: 'data.details.requestDetails.type',
        labelKey: 'common.type',
        width: 150,
        search: defineSearchProps('input', {expression: 'eq', queryName: 'filter_[type_eq]'}),
      },
      {
        key: 'data.details.requestDetails.requestHeaders.user-agent',
        labelKey: 'common.system',
        width: 150,
      },
    ],
  },
)
