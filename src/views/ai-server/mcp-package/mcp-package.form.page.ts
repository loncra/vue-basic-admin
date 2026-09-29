import {h, ref} from 'vue'
import {InputNumber, Select, SpaceCompact} from 'antdv-next'
import type {NameValueEnumMetadata} from '@loncra/client/commons'
import type {DataDictionaryMetadata} from '@loncra/client/resource'
import {
  AI_SERVER_MCP_CLIENT_TYPE,
  type McpPackageSavePayload,
  type SseMcpClientTransportMetadata,
  type StdioMcpClientTransportMetadata,
  type StreamableHttpMcpClientTransportMetadata,
} from '@loncra/client/ai'
import {defineFormPage} from '@loncra/antdv-pro'
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

/**
 * 图标字体清单（旧页面的 `options.icons`）；分组字典不在这里 —— `category` 的 `render` 里
 * 直接读 `ctx.dictionaries`。
 */
const ICON_FONTS = ['/font_ai_icon/iconfont.json']
const iconOptions = ref<IconfontJson[]>([])
/**
 * **本文件不导出任何选项 ref**：壳里那三处枚举（时间单位 / 客户端类型 / 是否）与声明里
 * `initializeTimeout` 用的是**同一份来源** —— 来源清单写在下面的 `enums`，pro 统一拉完给两边：
 * 声明侧读字段级 `ctx.buckets`，壳侧读槽作用域的 `buckets`（`CrudFormPageSlots.default`）
 * ⇒ 谁都不用自己再发一次请求，也不必靠模块级 ref 中转。
 */

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
 * - `icon` **不写 `render`**：走注册表内置的 `iconSelect`（`iconRender` 与技能包表单**同一个口径**，
 *   带宿主的 `align` 类）；
 * - `category` / `initializeTimeout` 两处是组合控件 ⇒ `render` 自绘。
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
      /**
       * 走注册表内置的 `iconSelect`（值绑定 / label 归 pro）；`props` 的函数形态与理由同
       * `skill-package.form.page.ts`（图标清单在 `preMounted` 才灌进 `iconOptions`）。
       */
      component: 'iconSelect',
      props: () => ({
        class: 'w-full',
        mode: ICON_SELECT_MODE.AVATAR,
        // 与 `skill-package.form.page.ts` 同一个口径：`align` 是宿主的图标字体微调类
        iconRender: (type: string) => renderIconFont(type, 'align'),
        options: iconOptions.value,
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
          options: (ctx.dictionaries[MCP_GROUP_CODE_PREFIX] ?? []).map((item) => ({
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
              options: (ctx.buckets[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[
                SYSTEM_ENUM_TYPE.TIME_UNIT_ENUM
              ] ?? []) as NameValueEnumMetadata<string>[],
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
  /**
   * 显式声明的来源（**逃生口**）：这两个桶没有任何字段引用 —— `TIME_UNIT_ENUM` 给 `initializeTimeout`
   * 的单位下拉（声明侧）与客户端 `timeout` 的单位（壳侧）、`MCP_CLIENT_TYPE_ENUM` 给壳里的分段控件
   * ⇒ 写在这儿让 pro 统一拉，**两边读的是同一份**：声明侧读字段级 `ctx.buckets`，壳侧读槽作用域的
   * `buckets`（`CrudFormPageSlots.default`）。
   * `YES_OR_NO`（核心 `dynamicActivation.enumRef`）与分组字典（核心 `category.dictId`）由 pro 推导 ✓
   * —— 壳里的「启动时连接」「可续传流」读的就是这份 `YES_OR_NO`。
   */
  enums: [
    {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, ids: [SYSTEM_ENUM_TYPE.TIME_UNIT_ENUM]},
    {module: SYSTEM_MODULE_NAME.AI_SERVER, ids: [SYSTEM_ENUM_TYPE.MCP_CLIENT_TYPE_ENUM]},
  ],
  /** 只剩"必须自己拉"的那段：本地图标字体（与 `skill-package.form.page.ts` 同一个口径） */
  preMounted: async () => {
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
