<script setup lang="ts">
import {ref} from 'vue'
import type {
  McpPackageEntity,
  SseMcpClientTransportMetadata,
  StdioMcpClientTransportMetadata,
} from '@loncra/client/ai'
import {MCP_CLIENT_HTTP_TYPE_VALUE} from '@loncra/client/ai'
import {KeyValueTable} from '@loncra/antdv'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {getEnumName} from '@loncra/client/commons'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {useConfigProviderStore} from '@/stores/configProviderStore'
import {renderIconFont} from '@/utils'
import type {McpPackageEntity as McpPackageEntityWithSources} from '@/types/apis'
import LMcpClarifyPolicyTable from '@/views/ai-server/mcp-package/ClarifyPolicyTable.vue'
import {mcpPackageCore} from './mcp-package.page'
import {mcpPackageDetailPage} from './mcp-package.detail.page'

defineOptions({
  name: 'AiServerMcpPackageDetail',
})

const configProviderStore = useConfigProviderStore()
const detailRef = ref<{entity?: McpPackageEntity}>()

const {ok, id} = useRequiredQuery()

useEntityPageTitle(() => detailRef.value?.entity?.name)

const {onStale} = usePageExit({redirect: mcpPackageCore.routes?.home})

function mcpSources(entity: unknown): McpPackageEntityWithSources {
  return entity as McpPackageEntityWithSources
}
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="mcpPackageDetailPage"
    @stale="onStale"
  >
    <template #afterDescriptions="{entity}">
      <a-divider titlePlacement="start" plain>
        <a-space>
          <icon-font class="icon align" type="loncra-sliders-horizontal" />
          {{ $t('aiServer.mcpPackage.client') }}
          {{ entity.metadata.client.type }}
        </a-space>
      </a-divider>

      <template v-if="MCP_CLIENT_HTTP_TYPE_VALUE.includes(entity.metadata.client.type)">
        <a-descriptions
          class="mb-lg"
          bordered
          :layout="configProviderStore.antdv.state.detailLayout"
          :column="{xxxl: 3, xxl: 3, xl: 3, lg: 3, md: 1, sm: 1, xs: 1}"
        >
          <a-descriptions-item :label="$t('aiServer.mcpPackage.baseUrl')">
            {{ (entity.metadata.client as SseMcpClientTransportMetadata).baseUrl || '' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('aiServer.mcpPackage.endpoint')">
            {{ (entity.metadata.client as SseMcpClientTransportMetadata).endpoint || '' }}
          </a-descriptions-item>
          <a-descriptions-item
            v-if="(entity.metadata.client as SseMcpClientTransportMetadata).timeout"
            :label="$t('aiServer.mcpPackage.timeout')"
          >
            {{
              (entity.metadata.client as SseMcpClientTransportMetadata).timeout.value +
              ' ' +
              getEnumName((entity.metadata.client as SseMcpClientTransportMetadata).timeout.unit)
            }}
          </a-descriptions-item>
        </a-descriptions>

        <a-row :gutter="[configProviderStore.getToken().sizeMD]">
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <key-value-table
              :edit="false"
              :title="$t('aiServer.mcpPackage.headers')"
              v-model:value="mcpSources(entity).headerDataSource"
            >
              <template #title="{title}">
                <a-space>
                  <component :is="() => renderIconFont('loncra-form', 'align')" />
                  {{ title }}
                </a-space>
              </template>
            </key-value-table>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <key-value-table
              :edit="false"
              :title="$t('aiServer.mcpPackage.queryParams')"
              v-model:value="mcpSources(entity).queryParamDataSource"
            >
              <template #title="{title}">
                <a-space>
                  <component :is="() => renderIconFont('loncra-variable', 'align')" />
                  {{ title }}
                </a-space>
              </template>
            </key-value-table>
          </a-col>
        </a-row>
      </template>

      <template v-else>
        <a-descriptions
          class="mb-lg"
          bordered
          :layout="configProviderStore.antdv.state.detailLayout"
          :column="{xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1}"
        >
          <a-descriptions-item :label="$t('aiServer.mcpPackage.command')">
            {{ (entity.metadata.client as StdioMcpClientTransportMetadata).command || '' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('aiServer.mcpPackage.args')" :span="2">
            <a-tag
              :key="arg"
              v-for="arg of ((entity.metadata.client as StdioMcpClientTransportMetadata).args || [])"
            >
              {{ arg }}
            </a-tag>
          </a-descriptions-item>
        </a-descriptions>
        <key-value-table
          :edit="false"
          :title="$t('aiServer.mcpPackage.env')"
          v-model:value="mcpSources(entity).envDataSource"
        >
          <template #title="{title}">
            <a-space>
              <component :is="() => renderIconFont('loncra-variable', 'align')" />
              {{ title }}
            </a-space>
          </template>
        </key-value-table>
      </template>

      <l-mcp-clarify-policy-table
        class="mt-lg"
        :mcp-client="entity.metadata.client"
        :edit="false"
        :form-item-name-prefix="['metadata', 'clarifyPolicies']"
        v-model:value="entity.metadata.clarifyPolicies"
      />
    </template>
  </crud-detail-page>
</template>
