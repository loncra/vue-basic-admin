<script setup lang="ts">
import {ref} from 'vue'
import type {
  McpPackageEntity,
  SseMcpClientTransportMetadata,
  StdioMcpClientTransportMetadata,
} from '@loncra/client/ai'
import {KeyValueTable as LKeyValueTable} from '@loncra/antdv'
// ⚠️ 必须显式 import：宿主 `src/components` 下的旧 kit 渲染器被 unplugin-vue-components
// 自动注册成了**全局** `CrudDetailPage` ⇒ 漏 import 不报错、静默跑旧 kit（2026-09-28 踩过）
import {CrudDetailPage} from '@loncra/antdv-pro'
import {getEnumName} from '@loncra/client/commons'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {useConfigProviderStore} from '@/stores/configProviderStore'
import {renderIconFont} from '@/utils'
import {MCP_CLIENT_HTTP_TYPE_VALUE} from '@/constants'
/** 宿主在 client 实体上补的三张「键值表」行数据（`@/types/apis`）—— 插槽作用域是 client 类型，写它要收窄 */
import type {McpPackageEntity as McpPackageEntityWithSources} from '@/types/apis'
import LMcpClarifyPolicyTable from '@/components/ai-server/mcp/McpClarifyPolicyTable.vue'
import {mcpPackageCore} from './mcp-package.page'
import {mcpPackageDetailPage} from './mcp-package.detail.page'

/**
 * MCP 包详情页薄壳：字段、标签、枚举显示、跨列数、操作记录都在声明
 * （`mcp-package.detail.page.ts` / `mcp-package.page.ts`）；这里只剩四件宿主的事 ——
 * 主键（pro 不认路由）、标题、离场，外加「客户端」那一大块附表（按客户端类型分 HTTP / STDIO）。
 */
defineOptions({
  name: 'AiServerMcpPackageDetail',
})

const configProviderStore = useConfigProviderStore()
const detailRef = ref<{entity?: McpPackageEntity}>()

/** 详情必须有 id：缺了就摆清错误字段跳 400，且**壳不挂载**；**id 由它一并带出来**（快照） */
const {ok, id} = useRequiredQuery()

/** 标题：旧 `title-text` 是 `标题 (包名)` */
useEntityPageTitle(() => detailRef.value?.entity?.name)

/** 记录被删 ⇒ 回列表 + 关 tab（旧 `BasicDetail` 自己干的） */
const {onStale} = usePageExit({redirect: mcpPackageCore.routes?.home})

/**
 * 「键值表」那三张表的数据挂在宿主的扩展字段上（`@/types/apis` 的 `McpPackageEntity`），
 * 而插槽作用域给的是 client 实体 ⇒ 在边界收窄一次（模板里 `v-model` 也能落在它的成员上）。
 */
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
    <!-- 旧 `BasicDetail` 的同名插槽：描述列表之后、操作记录之前 -->
    <template #afterDescriptions="{entity}">
      <a-divider titlePlacement="start" plain>
        <a-space>
          <icon-font class="icon align" type="loncra-sliders-horizontal" />
          {{ $t('aiServer.mcpPackage.client') }}
          {{ entity.metadata.client.type }}
        </a-space>
      </a-divider>

      <!-- HTTP（SSE / Streamable）类客户端：地址三项 + headers / queryParams 两张只读键值表 -->
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
            <l-key-value-table
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
            </l-key-value-table>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <l-key-value-table
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
            </l-key-value-table>
          </a-col>
        </a-row>
      </template>

      <!-- STDIO 类客户端：命令 / 参数 + env 一张只读键值表 -->
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
        <l-key-value-table
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
        </l-key-value-table>
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
