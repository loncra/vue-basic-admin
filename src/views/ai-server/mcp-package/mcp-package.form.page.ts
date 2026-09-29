import {h, ref} from 'vue'
import {InputNumber, Select, SpaceCompact} from 'antdv-next'
import {IconSelect} from '@loncra/antdv'
import type {NameValueEnumMetadata, RestResult} from '@loncra/client/commons'
import type {DataDictionaryMetadata, EnumBucketsResponseBody} from '@loncra/client/resource'
import {
  AI_SERVER_MCP_CLIENT_TYPE,
  type McpPackageEntity,
  type McpPackageSavePayload,
  type SseMcpClientTransportMetadata,
  type StdioMcpClientTransportMetadata,
  type StreamableHttpMcpClientTransportMetadata,
} from '@loncra/client/ai'
import {defineFormPage} from '@loncra/antdv-pro'
import {ResourceServerService} from '@/apis'
import {loadIcon, renderIconFont} from '@/utils'
import type {IconfontJson} from '@/types/composables'
/** 宿主在 `metadata.client` 上补的三张「键值表」行数据（`@/types/apis`）—— 只在摊/收数据时要 */
import type {McpPackageEntity as McpPackageEntityWithSources} from '@/types/apis'
import {
  ICON_SELECT_MODE,
  MCP_CLIENT_HTTP_TYPE_VALUE,
  MCP_GROUP_CODE_PREFIX,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
  TIME_UNIT_TYPE,
  YES_OR_NO_TYPE,
} from '@/constants'
import {mcpPackageCore} from './mcp-package.page'

/** 分组字典（`category` 的选项） */
const groupOptions = ref<DataDictionaryMetadata[]>([])
/** 图标字体清单（旧页面的 `options.icons`） */
const ICON_FONTS = ['/font_ai_icon/iconfont.json']
const iconOptions = ref<IconfontJson[]>([])
/**
 * 时间单位：`initializeTimeout`（声明里）与客户端 `timeout`（壳里）都用 ⇒ **导出**给壳，
 * 一处拉、两处读（不再各拉一份）。
 */
export const mcpPackageTimeOptions = ref<NameValueEnumMetadata<string>[]>([])
/** 客户端类型：旧页面那个 `a-segmented` 用（分段控件在壳里）⇒ 同样导出给它 */
export const mcpPackageClientTypeOptions = ref<NameValueEnumMetadata<string>[]>([])
/**
 * 是否类开关（客户端那几处 `select` 在壳里）。`dynamicActivation` 本身吃核心字典的 `enumRef` ✓，
 * 但壳里的「启动时连接」「可续传流」也要同一份选项 ⇒ 导出。
 */
export const mcpPackageYesOrNoOptions = ref<NameValueEnumMetadata<number>[]>([])

/**
 * 实体初值（照抄旧页面 `createEmptyEntity`）。
 *
 * `headerDataSource` / `queryParamDataSource` / `envDataSource` 是**宿主给键值表用的行数据**
 * （不是后端字段）—— 壳里那几张表取数之前就要渲染，所以初值也得带上。
 */
function createEmptyEntity(): McpPackageEntityWithSources {
  return {
    id: undefined as unknown as number,
    version: undefined as unknown as number,
    name: '',
    packageKey: '',
    summary: '',
    tags: [],
    additionalInformation: '',
    authMode: undefined as unknown as number,
    origin: undefined as unknown as number,
    status: undefined as unknown as number,
    type: undefined as unknown as number,
    category: undefined as unknown as DataDictionaryMetadata,
    dynamicActivation: YES_OR_NO_TYPE.NO,
    icon: '',
    initializeTimeout: {
      value: 1,
      unit: TIME_UNIT_TYPE.MINUTES,
    },
    metadata: {
      client: {
        type: AI_SERVER_MCP_CLIENT_TYPE.STREAMABLE_HTTP,
        baseUrl: '',
        endpoint: '/mcp',
        timeout: {
          value: 1,
          unit: TIME_UNIT_TYPE.MINUTES,
        },
        headers: {},
        queryParams: {},
        openConnectionOnStartup: 0,
        resumableStreams: 0,
      } as StreamableHttpMcpClientTransportMetadata,
      clarifyPolicies: [],
    },
    envDataSource: [],
    headerDataSource: [],
    queryParamDataSource: [],
  }
}

/**
 * MCP 包新增/编辑（`Form.vue`）。核心在 `mcp-package.page.ts`，这里只写表单形态。
 *
 * **声明与壳的分工**：
 * - `#rowLayout` 里那 12 个字段在声明里（默认 `col` = 一行两个，与旧页面 `md:12` 一致；
 *   `summary` / `additionalInformation` 是 `:span="24"` ⇒ `col: {span: 24}`）；
 * - **「客户端」那一大块留在壳的 `#default` 插槽**：它是按 `metadata.client.type` 整体分叉的两套
 *   附表（HTTP / STDIO）+ 三张键值表 + 澄清策略表（宿主组件 `KeyValueTable` /
 *   `McpClarifyPolicyTable`）⇒ 与详情页同一个处理方式；
 * - 枚举字段（`authMode` / `origin` / `status` / `type` / `dynamicActivation`）**不写 options**：
 *   核心字典有 `enumRef` ⇒ pro 自动拉桶；
 * - `icon` / `category` / `initializeTimeout` 三处是组合控件 ⇒ `render` 自绘（表单字段 key
 *   不支持 `a.b` 路径）。`icon` 的 `iconRender` 与技能包表单**同一个口径**（带宿主的 `align` 类）。
 */
export const mcpPackageFormPage = defineFormPage(mcpPackageCore, {
  createEntity: () => createEmptyEntity() as unknown as McpPackageSavePayload,
  fields: [
    {key: 'name', component: 'input', rules: [{required: true}]},
    {
      key: 'packageKey',
      component: 'input',
      rules: [{required: true}],
      /** 编辑态不让改（旧页面读 `$route.query.id`；这里读实体 —— 取数后 id 就有了） */
      props: (ctx) => ({disabled: ctx.entity.id !== undefined}),
    },
    {
      key: 'icon',
      render: (ctx) =>
        h(IconSelect, {
          class: 'w-full',
          mode: ICON_SELECT_MODE.AVATAR,
          // 与 `skill-package.form.page.ts` 同一个口径：`align` 是宿主的图标字体微调类
          iconRender: (type: string) => renderIconFont(type, 'align'),
          value: ctx.entity.icon,
          options: iconOptions.value,
          'onUpdate:value': (value: string) => {
            ctx.entity.icon = value
          },
        }),
    },
    {
      key: 'category',
      /**
       * 值存**整条字典项**（旧页面 `@change` 把 option 整个塞回实体）⇒ 只能 `render`。
       * options 手工摊成 `{label, value, data}`（字典项的 `value` 允许 boolean，与 Select 的
       * `DefaultOptionType` 不兼容），`data` 里留着整条以便回写。
       */
      render: (ctx) =>
        h(Select, {
          class: 'w-full',
          value: ctx.entity.category?.code,
          options: groupOptions.value.map((item) => ({
            label: item.name,
            value: item.code,
            data: item,
          })),
          allowClear: true,
          onChange: (_value: unknown, option: unknown) => {
            const picked = (option as {data?: DataDictionaryMetadata} | undefined)?.data
            if (picked) {
              ctx.entity.category = picked
            }
          },
        }),
    },
    {key: 'authMode', component: 'select', rules: [{required: true}]},
    {key: 'origin', component: 'select', rules: [{required: true}]},
    {
      key: 'tags',
      component: 'select',
      props: {mode: 'tags', maxTagCount: 'responsive'},
    },
    {key: 'type', component: 'select', rules: [{required: true}]},
    {key: 'dynamicActivation', component: 'select', rules: [{required: true}]},
    {
      key: 'initializeTimeout',
      /** 数值 + 单位（旧页面那个 `a-space-compact`） */
      render: (ctx) => {
        const timeout = ctx.entity.initializeTimeout as {value: number; unit: string}
        return h(SpaceCompact, {block: true}, {
          default: () => [
            h(InputNumber, {
              class: 'w-full',
              min: 1,
              value: timeout.value,
              'onUpdate:value': (value: unknown) => {
                timeout.value = value as number
              },
            }),
            h(Select, {
              class: 'w-auto',
              options: mcpPackageTimeOptions.value,
              fieldNames: {label: 'name'},
              value: timeout.unit,
              'onUpdate:value': (value: unknown) => {
                timeout.unit = value as string
              },
            }),
          ],
        })
      },
    },
    {
      key: 'summary',
      component: 'textarea',
      col: {span: 24},
      props: {rows: 4, showCount: true, maxlength: 512},
    },
    {
      key: 'additionalInformation',
      component: 'textarea',
      col: {span: 24},
      props: {rows: 4, showCount: true, maxlength: 512},
    },
  ],
  /** 旧页面 `preMounted`：时间单位 + 分组字典 + 图标字体（枚举那几份由核心字典的 `enumRef` 接管） */
  preMounted: async () => {
    const enums: RestResult<EnumBucketsResponseBody> =
      await ResourceServerService.getServiceEnumerates({
        [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: [
          {id: SYSTEM_ENUM_TYPE.YES_OR_NO},
          {id: SYSTEM_ENUM_TYPE.TIME_UNIT_ENUM},
        ],
        [SYSTEM_MODULE_NAME.AI_SERVER]: [{id: SYSTEM_ENUM_TYPE.MCP_CLIENT_TYPE_ENUM}],
      })
    const resourceServer = enums.data?.[SYSTEM_MODULE_NAME.RESOURCE_SERVER] ?? {}
    const aiServer = enums.data?.[SYSTEM_MODULE_NAME.AI_SERVER] ?? {}
    mcpPackageYesOrNoOptions.value = (resourceServer[SYSTEM_ENUM_TYPE.YES_OR_NO] ??
      []) as NameValueEnumMetadata<number>[]
    mcpPackageTimeOptions.value = (resourceServer[SYSTEM_ENUM_TYPE.TIME_UNIT_ENUM] ??
      []) as NameValueEnumMetadata<string>[]
    mcpPackageClientTypeOptions.value = (aiServer[SYSTEM_ENUM_TYPE.MCP_CLIENT_TYPE_ENUM] ??
      []) as NameValueEnumMetadata<string>[]

    const dictionaries: RestResult<Record<string, DataDictionaryMetadata[]>> =
      await ResourceServerService.findDataDictionariesByCodes([MCP_GROUP_CODE_PREFIX])
    groupOptions.value = dictionaries.data?.[MCP_GROUP_CODE_PREFIX] ?? []

    iconOptions.value = []
    for (const icon of ICON_FONTS) {
      iconOptions.value.push(await loadIcon(import.meta.env.VITE_APP_SITE_URL + icon))
    }
  },
  /**
   * 旧页面 `postGetEntity`：把 `metadata.client` 的 headers / queryParams / env 摊成键值表
   * 要吃的行数据（这三张不是后端字段 ⇒ 在宿主扩展类型上写）。
   */
  postGetEntity: (entity) => {
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
  /**
   * 旧页面 `preSubmit`：先把壳里三张键值表"正在编辑"的行确认掉（`ctx.extra` 递进来的回调），
   * 再把行数据摊回 `metadata.client` 的 headers / queryParams / env。
   */
  preSubmit: (ctx) => {
    const confirm = ctx.extra.confirmKeyValueTables as (() => void) | undefined
    confirm?.()
    const entity = ctx.entity.value as McpPackageEntityWithSources
    const client = entity.metadata.client
    if (MCP_CLIENT_HTTP_TYPE_VALUE.includes(client.type)) {
      const http = client as SseMcpClientTransportMetadata
      http.headers = Object.fromEntries(
        (entity.headerDataSource ?? []).map((row) => [row.key, row.value as unknown as string[]]),
      )
      http.queryParams = Object.fromEntries(
        (entity.queryParamDataSource ?? []).map((row) => [
          row.key,
          row.value as unknown as string[],
        ]),
      )
    } else if (client.type === AI_SERVER_MCP_CLIENT_TYPE.STDIO) {
      const stdio = client as StdioMcpClientTransportMetadata
      stdio.env = Object.fromEntries(
        (entity.envDataSource ?? []).map((row) => [row.key, String(row.value)]),
      )
    }
  },
})
