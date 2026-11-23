import {h, ref} from 'vue'
import {InputNumber, Select, SpaceCompact} from 'antdv-next'
import {
  type DataDictionaryMetadata,
  getEnumValue,
  type IdNameMetadata,
  type NameValueEnumMetadata,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
  TIME_UNIT_TYPE,
  YES_OR_NO_TYPE
} from '@loncra/client/commons'
import {
  AI_SERVER_API_KEY_MODE,
  AI_SERVER_MCP_CLIENT_AUTH_FIELD,
  AI_SERVER_MCP_CLIENT_TYPE,
  MCP_CLIENT_HTTP_MANUAL_AUTH_VALUE,
  MCP_CLIENT_HTTP_TYPE_VALUE,
  MCP_CLIENT_STDIO_MANUAL_AUTH_VALUE,
  MCP_GROUP_CODE_PREFIX,
  type McpPackageEntity as ClientMcpPackageEntity,
  type McpPackageSavePayload,
  type SseMcpClientTransportMetadata,
  type StdioMcpClientTransportMetadata,
  type StreamableHttpMcpClientTransportMetadata,
} from '@loncra/client/ai'
import {defineFormPage, loadIcon} from '@loncra/antdv-pro'
import {iconFontRender} from '@/icons/iconFont'
import type {IconfontJson, KeyValueRow} from '@loncra/antdv'
import {ICON_SELECT_MODE} from '@loncra/antdv'
import {mcpPackageCore} from './mcp-package.page'
import i18n from "@/i18n";

export interface McpPackageEntity extends ClientMcpPackageEntity {
  headerDataSource?: KeyValueRow[]
  queryParamDataSource?: KeyValueRow[]
  envDataSource?: KeyValueRow[]
  manualAuth:{
    dataSource: KeyValueRow[],
    segmentedOptions:IdNameMetadata[]
  },
}

export type McpPackageEntityWithSources = McpPackageEntity

export function hydrateMcpClientDataSources(record: McpPackageEntityWithSources): McpPackageEntityWithSources {
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
}

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
      authConfig: {
        position: AI_SERVER_MCP_CLIENT_AUTH_FIELD.HEADERS,
        items: [],
      },
    },
    envDataSource: [],
    headerDataSource: [],
    queryParamDataSource: [],
    manualAuth: {
      dataSource:[],
      segmentedOptions:[]
    },
  }
}

function resetManualAutoData(entity:McpPackageEntity) {
  if (MCP_CLIENT_HTTP_TYPE_VALUE.includes(entity.metadata.client.type)) {

    entity.metadata.authConfig??= {position: AI_SERVER_MCP_CLIENT_AUTH_FIELD.HEADERS, items: []}

    if (!MCP_CLIENT_HTTP_MANUAL_AUTH_VALUE.includes(entity.metadata.authConfig.position)) {
      entity.metadata.authConfig.position = AI_SERVER_MCP_CLIENT_AUTH_FIELD.HEADERS
    }

    entity.manualAuth = {
      dataSource: entity.manualAuth?.dataSource || [],
      segmentedOptions: [
        {id: AI_SERVER_MCP_CLIENT_AUTH_FIELD.HEADERS, name: i18n.global.t('aiServer.mcpPackage.headers')},
        {id: AI_SERVER_MCP_CLIENT_AUTH_FIELD.QUERY_PARAMS, name: i18n.global.t('aiServer.mcpPackage.queryParams')},
      ],
    }
  } else  {

    entity.metadata.authConfig??= {position: AI_SERVER_MCP_CLIENT_AUTH_FIELD.ENV, items: []}

    if (!MCP_CLIENT_STDIO_MANUAL_AUTH_VALUE.includes(entity.metadata.authConfig.position)) {
      entity.metadata.authConfig.position = AI_SERVER_MCP_CLIENT_AUTH_FIELD.ENV
    }

    entity.manualAuth = {
      dataSource: entity.manualAuth?.dataSource || [],
      segmentedOptions: [
        {id: AI_SERVER_MCP_CLIENT_AUTH_FIELD.ENV, name: i18n.global.t('aiServer.mcpPackage.env')},
        {id: AI_SERVER_MCP_CLIENT_AUTH_FIELD.ARGS, name: i18n.global.t('aiServer.mcpPackage.args')},
      ],
    }
  }
}

function onAuthModeChange(entity:McpPackageEntityWithSources, value:number) {
  if (value !== AI_SERVER_API_KEY_MODE.MANUAL) {
    return
  }
  resetManualAutoData(entity)
}

export function hydrateManualAuth(record: McpPackageEntityWithSources): void {
  resetManualAutoData(record)
  record.manualAuth.dataSource = (record.metadata.authConfig?.items ?? []).map((item) => ({
    id: crypto.randomUUID(),
    key: item.key,
    placeholder: item.placeholder,
    editing: false,
  }))
}

export function onHttpClientTypeChange(value:string, entity: McpPackageEntityWithSources) {
  entity.metadata.client.type = value
  hydrateManualAuth(entity)
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
        iconRender: (type: string) => iconFontRender(type),
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
    {key: 'origin', component: 'select', rules: [{required: true}]},
    {
      key: 'authMode',
      component: 'select',
      rules: [{required: true}],
      afterSlot: 'afterAuthMode',
      props: (ctx) => ({
        onChange: (value: number) => {
          const record = ctx.entity as McpPackageEntityWithSources
          onAuthModeChange(record, value)
        }
      }),
    },
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
    if (getEnumValue(record.authMode) === AI_SERVER_API_KEY_MODE.MANUAL) {
      hydrateManualAuth(record)
    }
    return hydrateMcpClientDataSources(record)
  },
  preSubmit: (ctx) => {
    const confirm = ctx.extra.confirmKeyValueTables as (() => void) | undefined
    confirm?.()
    const entity = ctx.entity.value as McpPackageEntityWithSources
    const client = entity.metadata.client
    resetManualAutoData(entity)
    if (entity.metadata.authConfig) {
      entity.metadata.authConfig.items = (entity.manualAuth?.dataSource ?? []).map((row) => ({
        key: row.key,
        placeholder: String(row.placeholder ?? ''),
      }))
    }

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
