<script setup lang="ts">
import LBasicDetail from '@/components/basic/BasicDetail.vue'
import {AiMcpPackageService} from '@/apis/ai-server/aiMcpPackageService.ts'
import {getEnumName, requireNonNullOrUndefined} from '@/utils'
import {type ComponentInternalInstance, getCurrentInstance, ref} from 'vue'
import type {
  McpPackageEntity,
  SseMcpClientTransportMetadata,
  StdioMcpClientTransportMetadata,
} from '@/types/apis'
import {
  MCP_CLIENT_HTTP_TYPE_VALUE,
  MCP_CLIENT_TYPE,
  MCP_PACKAGE_ROUTE,
  OPERATION_DATA_TRACE_TABLE,
  TIME_UNIT_TYPE,
  YES_OR_NO_TYPE,
} from '@/constants'
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import LKeyValueTable from "@/components/basic/KeyValueTable.vue";
import LMcpClarifyPolicyTable from "@/components/ai-server/mcp/McpClarifyPolicyTable.vue";

defineOptions({
  name: 'AiServerMcpPackageDetail',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new AiMcpPackageService()

const entity = ref<McpPackageEntity>({
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
  dynamicActivation: YES_OR_NO_TYPE.NO,
  initializeTimeout: {
    value:0,
    unit:TIME_UNIT_TYPE.SECONDS
  },
  metadata: {
    client:{
      type: MCP_CLIENT_TYPE.STREAMABLE_HTTP,
    },
    clarifyPolicies: [],
  },
})

const configProviderStore = useConfigProviderStore()

function postGetEntity(entity: McpPackageEntity) {
  const client = entity.metadata.client
  if (MCP_CLIENT_HTTP_TYPE_VALUE.includes(client.type)) {
    const http = client as SseMcpClientTransportMetadata
    entity.headerDataSource = Object.entries(http.headers || {}).map(([key, value]) => ({
      id: crypto.randomUUID(),
      key,
      value: value as string[],
      editing: false,
    }))
    entity.queryParamDataSource = Object.entries(http.queryParams || {}).map(([key, value]) => ({
      id: crypto.randomUUID(),
      key,
      value: value as string[],
      editing: false,
    }))
  } else if (client.type === MCP_CLIENT_TYPE.STDIO) {
    const stdio = client as StdioMcpClientTransportMetadata
    entity.envDataSource = Object.entries(stdio.env || {}).map(([key, value]) => ({
      id: crypto.randomUUID(),
      key,
      value: String(value),
      editing: false,
    }))
  }
  return entity
}

</script>

<template>
  <div>
    <l-basic-detail
      :post-get-entity="postGetEntity"
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.AI_MCP_PACKAGE"
      :redirect="{name: MCP_PACKAGE_ROUTE.HOME}"
      :title-text="(title: string, record: McpPackageEntity) => title + ' (' + record.name + ')'"
      :service="service"
      :column="{xxxl: 3, xxl: 3, xl: 3, lg: 3, md: 1, sm: 1, xs: 1}"
      v-model:entity="entity"
    >
      <a-descriptions-item :label="globalProperties.$t('common.id')">
        {{ entity.id }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.name')">
        {{ entity.name }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.mcpPackage.packageKey')">
        {{ entity.packageKey }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.mcpPackage.authMode')">
        {{ getEnumName(entity.authMode) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.mcpPackage.origin')">
        {{ getEnumName(entity.origin) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.status')">
        {{ getEnumName(entity.status) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.type')">
        {{ getEnumName(entity.type) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.mcpPackage.dynamicActivation')">
        {{ getEnumName(entity.dynamicActivation) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.mcpPackage.initializeTimeout')">
        {{ entity.initializeTimeout.value + ' ' + getEnumName(entity.initializeTimeout.unit) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.mcpPackage.summary')" :span="3">
        {{ entity.summary || '' }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.mcpPackage.tags')" :span="3">
        {{ (entity.tags || []).join(',') }}
      </a-descriptions-item>
      <a-descriptions-item
        :label="globalProperties.$t('aiServer.mcpPackage.additionalInformation')"
        :span="3"
      >
        {{ entity.additionalInformation || '' }}
      </a-descriptions-item>

      <template #afterDescriptions>
        <a-divider orientation="left" plain>
          <a-space>
            <icon-font class="icon" type="loncra-sliders-horizontal" />
            {{ globalProperties.$t('aiServer.mcpPackage.client') }}
            {{ entity.metadata.client.type }}
          </a-space>
        </a-divider>
        <template v-if="MCP_CLIENT_HTTP_TYPE_VALUE.includes(entity.metadata.client.type)">
          <a-descriptions class="mb-lg"  bordered :layout="configProviderStore.state.detailLayout" :column="{xxxl: 3, xxl: 3, xl: 3, lg: 3, md: 1, sm: 1, xs: 1}">
            <a-descriptions-item :label="globalProperties.$t('aiServer.mcpPackage.baseUrl')">
              {{ (entity.metadata.client as SseMcpClientTransportMetadata).baseUrl || '' }}
            </a-descriptions-item>
            <a-descriptions-item :label="globalProperties.$t('aiServer.mcpPackage.endpoint')">
              {{ (entity.metadata.client as SseMcpClientTransportMetadata).endpoint || '' }}
            </a-descriptions-item>
            <a-descriptions-item :label="globalProperties.$t('aiServer.mcpPackage.timeout')" v-if="(entity.metadata.client as SseMcpClientTransportMetadata).timeout">
              {{ (entity.metadata.client as SseMcpClientTransportMetadata).timeout.value + ' ' + getEnumName((entity.metadata.client as SseMcpClientTransportMetadata).timeout.unit) }}
            </a-descriptions-item>
          </a-descriptions>
          <a-row :gutter="[configProviderStore.getToken().sizeMD]">
            <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
              <l-key-value-table
                :edit="false"
                icon="loncra-form"
                :title="globalProperties.$t('aiServer.mcpPackage.headers')"
                v-model:value="entity.headerDataSource"
              />
            </a-col>
            <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
              <l-key-value-table
                :edit="false"
                icon="loncra-variable"
                :title="globalProperties.$t('aiServer.mcpPackage.queryParams')"
                v-model:value="entity.queryParamDataSource"
              />
            </a-col>
          </a-row>
        </template>
        <template v-else>
          <a-descriptions class="mb-lg" bordered :layout="configProviderStore.state.detailLayout" :column="{xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1}">
            <a-descriptions-item :label="globalProperties.$t('aiServer.mcpPackage.command')">
              {{ (entity.metadata.client as StdioMcpClientTransportMetadata).command || '' }}
            </a-descriptions-item>
            <a-descriptions-item :label="globalProperties.$t('aiServer.mcpPackage.args')" :span="2">
              <a-tag :key="arg" v-for="arg of ((entity.metadata.client as StdioMcpClientTransportMetadata).args || [])">
                {{arg}}
              </a-tag>
            </a-descriptions-item>
          </a-descriptions>
          <l-key-value-table
            :edit="false"
            :title="globalProperties.$t('aiServer.mcpPackage.env')"
            icon="loncra-variable"
            v-model:value="entity.envDataSource"
          />
        </template>
        <l-mcp-clarify-policy-table
          class="mt-lg"
          :mcp-client="entity.metadata.client"
          :edit="false"
          :form-item-name-prefix="['metadata', 'clarifyPolicies']"
          v-model:value="entity.metadata.clarifyPolicies"
        />

      </template>
    </l-basic-detail>
  </div>
</template>
