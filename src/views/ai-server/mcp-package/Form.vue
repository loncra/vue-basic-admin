<script setup lang="ts">
import {ref} from 'vue'
import {useRoute} from 'vue-router'
import type {
  McpPackageSavePayload,
  SseMcpClientTransportMetadata,
  StdioMcpClientTransportMetadata,
  StreamableHttpMcpClientTransportMetadata,
} from '@loncra/client/ai'
import {AI_SERVER_MCP_CLIENT_TYPE} from '@loncra/client/ai'
import {KeyValueTable as LKeyValueTable} from '@loncra/antdv'
import {CrudFormPage} from '@loncra/antdv-pro'
/** 三张键值表的行数据是宿主扩展字段（不是后端字段）⇒ 模板里在这个类型上取/写 */
import type {McpPackageEntity as McpPackageEntityWithSources} from '@/types/apis'
import LMcpClarifyPolicyTable from '@/components/ai-server/mcp/McpClarifyPolicyTable.vue'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {useConfigProviderStore} from '@/stores/configProviderStore.ts'
import {MCP_CLIENT_HTTP_TYPE_VALUE, SYSTEM_CONSTANT} from '@/constants'
import {mcpPackageCore} from './mcp-package.page'
import {
  mcpPackageClientTypeOptions,
  mcpPackageFormPage,
  mcpPackageTimeOptions,
  mcpPackageYesOrNoOptions,
} from './mcp-package.form.page'

/**
 * MCP 包新增/编辑页薄壳：12 个字段、校验、初值、枚举来源、组合控件（图标 / 分组 / 初始化超时）
 * 以及 `preMounted` / `postGetEntity` / `preSubmit` 都在声明（`mcp-package.form.page.ts`）。
 *
 * 这里只剩：主键与标题、离场，外加**「客户端」那一大块**（旧页面它就在 `#rowLayout` 之外）——
 * 按 `metadata.client.type` 分叉的两套附表（HTTP / STDIO）+ 三张键值表 + 澄清策略表。
 * 留在壳里的两个原因：① 顺序与旧页面一致（声明里的字段会全部排在插槽之前）；
 * ② 都是宿主组件，且声明侧的 `preSubmit` 要靠它们 `confirmAllEditingRows()` 的 ref（走 `contextExtra`）。
 */
defineOptions({
  name: 'AiServerMcpPackageForm',
})

const route = useRoute()
const formRef = ref<{entity?: McpPackageSavePayload}>()

/** 主键：进页面那一刻取一次（快照）；新增态没有 id ⇒ pro 不取数 */
const id = route.query[SYSTEM_CONSTANT.ID_NAME] as number | undefined

const configProviderStore = useConfigProviderStore()

/** 三张键值表：`preSubmit` 里要先把"正在编辑"的行确认掉，再摊回 `metadata.client` */
const headerTableRef = ref<{confirmAllEditingRows: () => void}>()
const queryParamTableRef = ref<{confirmAllEditingRows: () => void}>()
const envTableRef = ref<{confirmAllEditingRows: () => void}>()

function confirmKeyValueTables() {
  headerTableRef.value?.confirmAllEditingRows()
  queryParamTableRef.value?.confirmAllEditingRows()
  envTableRef.value?.confirmAllEditingRows()
}

/** 标题：旧 `title-text` 是 `标题 (包名)`，新增态只给基标题 */
useEntityPageTitle(() => {
  const entity = formRef.value?.entity
  return entity?.id ? entity.name : undefined
})

/** 保存成功后的去向（旧页面 `:redirect="{name: MCP_PACKAGE_ROUTE.HOME}"`） */
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
    <!-- 字段行之后（旧页面同一顺序） -->
    <template #default="{entity}">
      <a-divider class="m-0 mb-md" title-placement="start" plain>
        <a-space>
          <icon-font class="icon align" type="loncra-sliders-horizontal" />
          {{ $t('aiServer.mcpPackage.client') }}
          <a-flex class="shrink-0">
            <a-segmented
              v-model:value="entity.metadata.client.type"
              :options="mcpPackageClientTypeOptions.map((c) => ({label: c.name, value: c.value}))"
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
                  :options="mcpPackageTimeOptions"
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
                  :options="mcpPackageYesOrNoOptions"
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
                  :options="mcpPackageYesOrNoOptions"
                  :field-names="{label: 'name'}"
                />
              </a-form-item>
            </a-col>
          </template>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <l-key-value-table
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
            </l-key-value-table>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <l-key-value-table
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
            </l-key-value-table>
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
            <l-key-value-table
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
            </l-key-value-table>
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
