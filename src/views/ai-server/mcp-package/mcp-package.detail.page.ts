import {
  AI_SERVER_MCP_CLIENT_TYPE,
  type McpPackageEntity,
  type SseMcpClientTransportMetadata,
  type StdioMcpClientTransportMetadata,
} from '@loncra/client/ai'
import {getEnumName} from '@loncra/client/commons'
import {defineDetailPage} from '@loncra/antdv-pro'
import {MCP_CLIENT_HTTP_TYPE_VALUE, TIME_UNIT_TYPE, YES_OR_NO_TYPE} from '@/constants'
/** 宿主在 client 实体上补的三张「键值表」行数据（`@/types/apis`）—— 只在摊数据时要 */
import type {McpPackageEntity as McpPackageEntityWithSources} from '@/types/apis'
import {mcpPackageCore} from './mcp-package.page'

/** `a-descriptions` 的响应式列数（照抄旧 `Detail.vue` 的 `:column`） */
const COLUMN = {xxxl: 3, xxl: 3, xl: 3, lg: 3, md: 1, sm: 1, xs: 1}

/**
 * MCP 包详情（`Detail.vue`）。核心在 `mcp-package.page.ts`，这里只写详情形态。
 *
 * 两处照旧：
 * - `authMode` / `origin` / `status` / `type` / `dynamicActivation` 都在核心字典里写
 *   `format: 'enum'`（= `getEnumName`）⇒ 不手写 `render`；
 * - 初始化超时 = `值 + ' ' + 单位名`（旧页面那行拼接）⇒ `render`。
 *
 * 「客户端」那一大块（按 `metadata.client.type` 分 HTTP / STDIO 两套附表 + 键值表 + 澄清策略表）
 * **不在声明里**：它是宿主组件（`KeyValueTable` / `McpClarifyPolicyTable`）且按客户端类型整体分叉
 * ⇒ 照旧留在 `Detail.vue` 的 `#afterDescriptions` 里。
 */
export const mcpPackageDetailPage = defineDetailPage(mcpPackageCore, {
  column: COLUMN,
  /**
   * 实体初值（照抄旧 `Detail.vue` 那坨 `ref<McpPackageEntity>({...})`）：
   * 取数之前就渲染，`#afterDescriptions` 里读 `entity.metadata.client` 才不会炸。
   */
  createEntity: () => ({
    id: 0,
    version: 0,
    name: '',
    packageKey: '',
    summary: '',
    tags: [],
    additionalInformation: '',
    authMode: 0,
    origin: 0,
    status: 0,
    type: 0,
    icon: '',
    dynamicActivation: YES_OR_NO_TYPE.NO,
    initializeTimeout: {value: 0, unit: TIME_UNIT_TYPE.SECONDS},
    metadata: {
      client: {type: AI_SERVER_MCP_CLIENT_TYPE.STREAMABLE_HTTP},
      clarifyPolicies: [],
    },
  }),
  fields: [
    'id',
    'name',
    'packageKey',
    'authMode',
    'origin',
    'status',
    'type',
    'dynamicActivation',
    {
      key: 'initializeTimeout',
      render: (_value, entity: McpPackageEntity) =>
        `${entity.initializeTimeout?.value ?? ''} ${getEnumName(entity.initializeTimeout?.unit)}`,
    },
    {key: 'summary', span: 'filled'},
    {
      key: 'tags',
      span: 'filled',
      render: (_value, entity: McpPackageEntity) => (entity.tags || []).join(','),
    },
    {key: 'additionalInformation', span: 'filled'},
  ],
  /**
   * 旧页面的 `postGetEntity`：把 `metadata.client` 的 headers / queryParams / env 摊成
   * 「键值表」要吃的行数据（`headerDataSource` / `queryParamDataSource` / `envDataSource`
   * 是给 `#afterDescriptions` 里那几张只读表用的，不是后端字段）。
   */
  postGetEntity: (entity) => {
    // 这三张表不是后端字段 ⇒ 在宿主扩展类型上写（收窄一次，边界就干净了）
    const record = entity as McpPackageEntityWithSources
    const client = record.metadata.client
    if (MCP_CLIENT_HTTP_TYPE_VALUE.includes(client.type)) {
      const http = client as SseMcpClientTransportMetadata
      record.headerDataSource = Object.entries(http.headers || {}).map(([key, value]) => ({
        id: crypto.randomUUID(),
        key,
        value: value as string[],
        editing: false,
      }))
      record.queryParamDataSource = Object.entries(http.queryParams || {}).map(([key, value]) => ({
        id: crypto.randomUUID(),
        key,
        value: value as string[],
        editing: false,
      }))
    } else if (client.type === AI_SERVER_MCP_CLIENT_TYPE.STDIO) {
      const stdio = client as StdioMcpClientTransportMetadata
      record.envDataSource = Object.entries(stdio.env || {}).map(([key, value]) => ({
        id: crypto.randomUUID(),
        key,
        value: String(value),
        editing: false,
      }))
    }
    return record
  },
})
