import type {AuditEventEntity} from '@loncra/client/auth'
import {defineDetailPage} from '@loncra/antdv-pro'
import {auditEventCore, auditEventService} from './audit-event.page'

/** `a-descriptions` 的响应式列数（照抄旧 `Detail.vue` 的 `:column`） */
const COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}

/**
 * 审计事件详情（`Detail.vue`，「认证事件」与「操作数据轨迹」两个列表共用）。核心在 `audit-event.page.ts`。
 *
 * - **取数走 `getDetail`**（旧 `:get-detail`）：这个接口要带 `after` 查询参数（宿主的路由约定，
 *   pro 的默认 `service.get(id)` 拼不出来）⇒ `after` 由壳从 `contextExtra` 递进来；
 * - `principal` 的显示有优先级（`data.details.metadata.realName` 优先）⇒ `render`；
 * - `timestamp` 用核心字典里的 `format: 'dateTime'`（pro 内置 formatter，不用在声明里调 composable）；
 * - 「请求信息」那几块（details / headers / parameters / body / operationTrace）**不在声明里**：
 *   它们是按数据有没有整体显隐、且要遍历对象画 `a-descriptions` ⇒ 留在壳的 `#afterDescriptions`。
 */
export const auditEventDetailPage = defineDetailPage(auditEventCore, {
  column: COLUMN,
  /** 实体初值（照抄旧页面那个 `ref<AuditEventEntity>({...})`）：取数前就渲染 */
  createEntity: () => ({
    id: '',
    principal: '',
    timestamp: 0,
    type: '',
  }),
  fields: [
    'id',
    {
      key: 'principal',
      render: (_value, entity: AuditEventEntity) =>
        entity.data?.details?.metadata?.realName || entity.principal,
    },
    'timestamp',
    'type',
  ],
  /**
   * 旧页面 `:get-detail` —— `AuditEventService.detail(id, after)`。
   * `pro` 的 `getDetail` 收**干净值**（`RestResult` 的拆包在声明里做）✓
   */
  getDetail: async (id, ctx) => {
    // 接口签名是 `detail(id: string, after: string)`（两个都必填）⇒ `after` 缺省给空串
    const result = await auditEventService.detail(String(id), String(ctx.extra.after ?? ''))
    return result.data ?? undefined
  },
})
