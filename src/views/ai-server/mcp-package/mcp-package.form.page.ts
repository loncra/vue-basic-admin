import {h, ref} from 'vue'
import {InputNumber, Select, SpaceCompact} from 'antdv-next'
import type {NameValueEnumMetadata} from '@loncra/client/commons'
import {
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
  TIME_UNIT_TYPE,
  YES_OR_NO_TYPE
} from '@loncra/client/commons'
import type {DataDictionaryMetadata} from '@loncra/client/resource'
import {
  AI_SERVER_MCP_CLIENT_TYPE,
  MCP_CLIENT_HTTP_TYPE_VALUE,
  MCP_GROUP_CODE_PREFIX,
  type McpPackageSavePayload,
  type SseMcpClientTransportMetadata,
  type StdioMcpClientTransportMetadata,
  type StreamableHttpMcpClientTransportMetadata,
} from '@loncra/client/ai'
import {defineFormPage} from '@loncra/antdv-pro'
import {loadIcon, renderIconFont} from '@/utils'
import type {IconfontJson} from '@/types/composables'
import type {McpPackageEntity as McpPackageEntityWithSources} from '@/types/apis'
import {ICON_SELECT_MODE} from '@loncra/antdv'
import {mcpPackageCore} from './mcp-package.page'

const ICON_FONTS = ['/font_ai_icon/iconfont.json']
const iconOptions = ref<IconfontJson[]>([])

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

export const mcpPackageFormPage = defineFormPage(mcpPackageCore, {
  createEntity: () => createEmptyEntity() as unknown as McpPackageSavePayload,
  fields: [
    {key: 'name', component: 'input', rules: [{required: true}]},
    {
      key: 'packageKey',
      component: 'input',
      rules: [{required: true}],
      props: (ctx) => ({disabled: ctx.entity.id !== undefined}),
    },
    {
      key: 'icon',
      component: 'iconSelect',
      props: () => ({
        class: 'w-full',
        mode: ICON_SELECT_MODE.AVATAR,
        iconRender: (type: string) => renderIconFont(type),
        options: iconOptions.value,
      }),
    },
    {
      key: 'category',
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
  enums: [
    {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, ids: [SYSTEM_ENUM_TYPE.TIME_UNIT_ENUM]},
    {module: SYSTEM_MODULE_NAME.AI_SERVER, ids: [SYSTEM_ENUM_TYPE.MCP_CLIENT_TYPE_ENUM]},
  ],
  preMounted: async () => {
    iconOptions.value = []
    for (const icon of ICON_FONTS) {
      iconOptions.value.push(await loadIcon(import.meta.env.VITE_APP_SITE_URL + icon))
    }
  },
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
