import {AI_SERVER_MCP_CLIENT_TYPE, type McpPackageEntity,} from '@loncra/client/ai'
import {getEnumName, TIME_UNIT_TYPE, YES_OR_NO_TYPE} from '@loncra/client/commons'
import {defineDetailPage} from '@loncra/antdv-pro'
import {
  hydrateMcpClientDataSources,
  type McpPackageEntityWithSources
} from './mcp-package.form.page'
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
    const record = hydrateMcpClientDataSources(entity as McpPackageEntityWithSources)
    record.manualAuthDataSource = (record.metadata.authConfig?.items ?? []).map((item) => ({
      id: crypto.randomUUID(),
      key: item.key,
      placeholder: item.placeholder,
      editing: false,
    }))
    return record
  },
})
