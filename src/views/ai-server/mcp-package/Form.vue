<script setup lang="ts">
import {ref} from 'vue'
import type {
  McpPackageSavePayload,
  SseMcpClientTransportMetadata,
  StdioMcpClientTransportMetadata,
  StreamableHttpMcpClientTransportMetadata,
} from '@loncra/client/ai'
import {AI_SERVER_MCP_CLIENT_TYPE, MCP_CLIENT_HTTP_TYPE_VALUE} from '@loncra/client/ai'
import type {EnumBucketsResponseBody} from '@loncra/client/resource'
import {KeyValueTable} from '@loncra/antdv'
import {CrudFormPage} from '@loncra/antdv-pro'
import type {McpPackageEntity as McpPackageEntityWithSources} from '@/types/apis'
import LMcpClarifyPolicyTable from '@/views/ai-server/mcp-package/ClarifyPolicyTable.vue'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {useConfigProviderStore} from '@/stores/configProviderStore.ts'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME} from '@loncra/client/commons'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {mcpPackageCore} from './mcp-package.page'
import {mcpPackageFormPage} from './mcp-package.form.page'

defineOptions({
  name: 'AiServerMcpPackageForm',
})

const formRef = ref<{entity?: McpPackageSavePayload}>()

const {id} = useRequiredQuery(['id'], {required: false})

const configProviderStore = useConfigProviderStore()

const headerTableRef = ref<{confirmAllEditingRows: () => void}>()
const queryParamTableRef = ref<{confirmAllEditingRows: () => void}>()
const envTableRef = ref<{confirmAllEditingRows: () => void}>()

function confirmKeyValueTables() {
  headerTableRef.value?.confirmAllEditingRows()
  queryParamTableRef.value?.confirmAllEditingRows()
  envTableRef.value?.confirmAllEditingRows()
}

function clientTypeOptions(buckets: EnumBucketsResponseBody | undefined) {
  return (
    buckets?.[SYSTEM_MODULE_NAME.AI_SERVER]?.[SYSTEM_ENUM_TYPE.MCP_CLIENT_TYPE_ENUM] ?? []
  ).map((item) => ({label: item.name, value: String(item.value)}))
}

useEntityPageTitle(() => {
  const entity = formRef.value?.entity
  return entity?.id ? entity.name : undefined
})

const {onSuccess, onStale, formKey} = useFormSuccessBack({
  redirect: mcpPackageCore.routes?.home,
  entity: () => formRef.value?.entity,
})
</script>

<template>
  <crud-form-page
    ref="formRef"
    :key="formKey"
    :id="id"
    :page="mcpPackageFormPage"
    :context-extra="{confirmKeyValueTables}"
    @success="onSuccess"
    @stale="onStale"
  >
    <template #default="{entity, buckets}">
      <a-divider class="m-0 mb-md" title-placement="start" plain>
        <a-space>
          <icon-font class="icon align" type="loncra-sliders-horizontal" />
          {{ $t('aiServer.mcpPackage.client') }}
          <a-flex class="shrink-0">
            <a-segmented
              v-model:value="entity.metadata.client.type"
              :options="clientTypeOptions(buckets)"
              @change="(value: string) => (entity.metadata.client.type = value)"
            />
          </a-flex>
        </a-space>
      </a-divider>

      <a-row :gutter="[configProviderStore.getToken().sizeMD]">
        <template v-if="MCP_CLIENT_HTTP_TYPE_VALUE.includes(entity.metadata.client.type)">
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item
              :name="['metadata', 'client', 'baseUrl']"
              :label="$t('aiServer.mcpPackage.baseUrl')"
              :rules="[{required: true}]"
            >
              <a-space-compact block>
                <a-input
                  v-model:value="(entity.metadata.client as SseMcpClientTransportMetadata).baseUrl"
                />
                <a-input
                  class="w-auto"
                  v-model:value="(entity.metadata.client as SseMcpClientTransportMetadata).endpoint"
                />
              </a-space-compact>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item :label="$t('aiServer.mcpPackage.timeout')">
              <a-space-compact block>
                <a-input-number
                  class="w-full"
                  v-model:value="(entity.metadata.client as SseMcpClientTransportMetadata).timeout.value"
                  :min="1"
                />
                <a-select
                  class="w-auto"
                  :options="buckets[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.TIME_UNIT_ENUM] ?? []"
                  :field-names="{label: 'name'}"
                  v-model:value="(entity.metadata.client as SseMcpClientTransportMetadata).timeout.unit"
                />
              </a-space-compact>
            </a-form-item>
          </a-col>
          <template
            v-if="entity.metadata.client.type === AI_SERVER_MCP_CLIENT_TYPE.STREAMABLE_HTTP"
          >
            <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
              <a-form-item
                :name="['metadata', 'client', 'openConnectionOnStartup']"
                :label="$t('aiServer.mcpPackage.openConnectionOnStartup')"
              >
                <a-select
                  class="w-full"
                  v-model:value="(entity.metadata.client as StreamableHttpMcpClientTransportMetadata).openConnectionOnStartup"
                  :options="buckets[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.YES_OR_NO] ?? []"
                  :field-names="{label: 'name'}"
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
              <a-form-item
                :name="['metadata', 'client', 'resumableStreams']"
                :label="$t('aiServer.mcpPackage.resumableStreams')"
              >
                <a-select
                  class="w-full"
                  v-model:value="(entity.metadata.client as StreamableHttpMcpClientTransportMetadata).resumableStreams"
                  :options="buckets[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.YES_OR_NO] ?? []"
                  :field-names="{label: 'name'}"
                />
              </a-form-item>
            </a-col>
          </template>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <key-value-table
              ref="headerTableRef"
              multiple-value
              :form-item-name-prefix="['headerDataSource']"
              :title="$t('aiServer.mcpPackage.headers')"
              v-model:value="(entity as McpPackageEntityWithSources).headerDataSource"
              @change="
                (_item, data) =>
                  ((entity.metadata.client as SseMcpClientTransportMetadata).headers =
                    Object.fromEntries(data.map((row) => [row.key, row.value as string[]])))
              "
            >
              <template #title="{title}">
                <a-space>
                  <icon-font class="icon align" type="loncra-form" />
                  {{ title }}
                </a-space>
              </template>
            </key-value-table>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <key-value-table
              ref="queryParamTableRef"
              multiple-value
              :form-item-name-prefix="['queryParamDataSource']"
              :title="$t('aiServer.mcpPackage.queryParams')"
              v-model:value="(entity as McpPackageEntityWithSources).queryParamDataSource"
              @change="
                (_item, data) =>
                  ((entity.metadata.client as SseMcpClientTransportMetadata).queryParams =
                    Object.fromEntries(data.map((row) => [row.key, row.value as string[]])))
              "
            >
              <template #title="{title}">
                <a-space>
                  <icon-font class="icon align" type="loncra-variable" />
                  {{ title }}
                </a-space>
              </template>
            </key-value-table>
          </a-col>
        </template>

        <template v-else>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item
              :name="['metadata', 'client', 'command']"
              :label="$t('aiServer.mcpPackage.command')"
              :rules="[{required: true}]"
            >
              <a-input
                v-model:value="(entity.metadata.client as StdioMcpClientTransportMetadata).command"
              />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item
              :name="['metadata', 'client', 'args']"
              :label="$t('aiServer.mcpPackage.args')"
              :rules="[{required: true}]"
            >
              <a-select
                class="w-full"
                mode="tags"
                v-model:value="(entity.metadata.client as StdioMcpClientTransportMetadata).args"
              />
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <key-value-table
              ref="envTableRef"
              :form-item-name-prefix="['envDataSource']"
              :title="$t('aiServer.mcpPackage.env')"
              v-model:value="(entity as McpPackageEntityWithSources).envDataSource"
              @change="
                (_item, data) =>
                  ((entity.metadata.client as StdioMcpClientTransportMetadata).env =
                    Object.fromEntries(data.map((row) => [row.key, String(row.value)])))
              "
            >
              <template #title="{title}">
                <a-space>
                  <icon-font class="icon align" type="loncra-variable" />
                  {{ title }}
                </a-space>
              </template>
            </key-value-table>
          </a-col>
        </template>

        <a-col :span="24" :class="['mt-lg', entity.id ? undefined : 'mb-lg']">
          <l-mcp-clarify-policy-table
            :mcp-client="entity.metadata.client"
            :form-item-name-prefix="['metadata', 'clarifyPolicies']"
            v-model:value="entity.metadata.clarifyPolicies"
          />
        </a-col>
      </a-row>
    </template>
  </crud-form-page>
</template>
