import type {SmsMessageEntity} from '@loncra/client/message'
import {defineDetailPage, executeStatusCell} from '@loncra/antdv-pro'
import {smsCore} from './sms.page'

/** `a-descriptions` 的响应式列数（照抄旧页面 `Detail.vue`） */
const COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1}

/**
 * 短信消息详情（`Detail.vue`）。核心在 `sms.page.ts`，这里只写详情形态。
 *
 * 三处照旧（都是旧页面的原样行为）：
 * - `channel` / `type` **不手写 `render`**：格式写在核心字典里（`format: 'enum'`）——
 *   `registry.ts` 的 `enum` formatter 就是 `getEnumName(value)`，值自带 `{name, value}` 出名称、
 *   裸 code 原样显示，与旧页面 `getEnumName(entity.xxx)` 完全等价；
 * - `executeStatus` **一律用 `render: executeStatusCell()`**（状态点 + 状态名；失败且有 `exception`
 *   时套 tooltip）—— 与列表那列同一个 helper（全仓规矩：executeStatus 不分形态都用它）；
 * - 手机号后面括注收件人（收件人姓名在 `metadata.toPrincipal.name`）；
 * - 重试次数与上限显示在同一项里（`重试 / 上限`）。
 */
export const smsDetailPage = defineDetailPage(smsCore, {
  column: COLUMN,
  fields: [
    'creationTime',
    'channel',
    'type',
    {
      key: 'phoneNumber',
      render: (value, entity: SmsMessageEntity) => {
        const name = (entity.metadata?.toPrincipal as {name?: string} | undefined)?.name
        return name ? `${String(value ?? '')} (${name})` : String(value ?? '')
      },
    },
    {key: 'executeStatus', render: executeStatusCell()},
    {
      key: 'retryCount',
      render: (_value, entity: SmsMessageEntity) =>
        `${entity.retryCount ?? ''} / ${entity.maxRetryCount ?? ''}`,
    },
    'retryTime',
    'successTime',
    {key: 'exception', span: 2},
    {key: 'remark', span: 2},
    {key: 'content', span: 2},
  ],
})
