import {
  AI_SERVER_MCP_CLIENT_TYPE,
  MCP_CLIENT_HTTP_TYPE_VALUE,
  type McpPackageEntity,
  type SseMcpClientTransportMetadata,
  type StdioMcpClientTransportMetadata,
} from '@loncra/client/ai'
import {getEnumName, TIME_UNIT_TYPE, YES_OR_NO_TYPE} from '@loncra/client/commons'
import {defineDetailPage} from '@loncra/antdv-pro'
import type {McpPackageEntity as McpPackageEntityWithSources} from '@/types/apis'
import {mcpPackageCore} from './mcp-package.page'

const COLUMN = {xxxl: 3, xxl: 3, xl: 3, lg: 3, md: 1, sm: 1, xs: 1}

export const mcpPackageDetailPage = defineDetailPage(mcpPackageCore, {
  column: COLUMN,
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
})
