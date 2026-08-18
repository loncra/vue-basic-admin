<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, ref} from 'vue'
import type {
  DataDictionaryMetadata,
  EnumBucketsResponseBody,
  McpPackageEntity,
  McpPackageSavePayload,
  NameValueEnumMetadata,
  RestResult,
  SseMcpClientTransportMetadata,
  StdioMcpClientTransportMetadata,
  StreamableHttpMcpClientTransportMetadata,
} from '@/types/apis'
import {loadIcon, requireNonNullOrUndefined} from '@/utils'
import LBasicForm from '@/components/basic/form/BasicForm.vue'
import {DataDictionaryService, ResourceServerService} from '@/apis'
import {AiMcpPackageService} from '@/apis/ai-server/aiMcpPackageService.ts'
import {
  ICON_SELECT_MODE,
  MCP_CLIENT_HTTP_TYPE_VALUE,
  MCP_CLIENT_TYPE,
  MCP_GROUP_CODE_PREFIX,
  MCP_PACKAGE_ROUTE,
  SYSTEM_CONSTANT,
  SYSTEM_MODULE_NAME,
  TIME_UNIT_TYPE,
  YES_OR_NO_TYPE,
} from '@/constants'
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import LMcpClarifyPolicyTable from "@/components/ai-server/mcp/McpClarifyPolicyTable.vue";
import LKeyValueTable from "@/components/basic/KeyValueTable.vue";
import LIconSelect from "@/components/basic/IconSelect.vue";
import type {IconfontJson} from "@/types/composables";

defineOptions({
  name: 'AiServerMcpPackageForm',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const configProviderStore = useConfigProviderStore();

const service = new AiMcpPackageService()
const dataDictionaryService = new DataDictionaryService()

function createEmptyEntity(): McpPackageEntity {
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
    dynamicActivation: YES_OR_NO_TYPE.NO,
    icon:'',
    initializeTimeout: {
      value:1,
      unit: TIME_UNIT_TYPE.MINUTES
    },
    metadata: {
      client: {
        type: MCP_CLIENT_TYPE.STREAMABLE_HTTP,
        baseUrl: '',
        endpoint: '/mcp',
        timeout: {
          value: 1,
          unit: TIME_UNIT_TYPE.MINUTES
        },
        headers: {},
        queryParams: {},
        openConnectionOnStartup: 0,
        resumableStreams: 0,
      } as StreamableHttpMcpClientTransportMetadata,
      clarifyPolicies: [],
    },
    envDataSource:[],
    headerDataSource:[],
    queryParamDataSource:[]
  }
}

const options = ref<{
  entity: McpPackageEntity
  spinning: boolean
  fetchingTools: boolean
  authModeOptions: NameValueEnumMetadata<number>[]
  originOptions: NameValueEnumMetadata<number>[]
  typeOptions: NameValueEnumMetadata<number>[]
  yesOrNoOptions: NameValueEnumMetadata<number>[]
  clientTypeOptions: NameValueEnumMetadata<string>[]
  timeOptions: NameValueEnumMetadata<string>[]
  groupOptions:DataDictionaryMetadata[]
  icons:string[]
  iconOptions: IconfontJson[]
}>({
  spinning: false,
  fetchingTools: false,
  entity: createEmptyEntity(),
  authModeOptions: [],
  originOptions: [],
  typeOptions: [],
  yesOrNoOptions: [],
  clientTypeOptions: [],
  timeOptions:[],
  icons:["/font_ai_icon/iconfont.json"],
  iconOptions:[],
  groupOptions:[]
})

const headerTableRef = ref<{ confirmAllEditingRows: () => void }>()
const queryParamTableRef = ref<{ confirmAllEditingRows: () => void }>()
const envTableRef = ref<{ confirmAllEditingRows: () => void }>()

async function preSubmit() {
  headerTableRef.value?.confirmAllEditingRows()
  queryParamTableRef.value?.confirmAllEditingRows()
  envTableRef.value?.confirmAllEditingRows()
  const client = options.value.entity.metadata.client
  if (MCP_CLIENT_HTTP_TYPE_VALUE.includes(client.type)) {
    const http = client as SseMcpClientTransportMetadata
    http.headers = Object.fromEntries((options.value.entity.headerDataSource ?? []).map(row => [row.key, row.value as string[]]))
    http.queryParams = Object.fromEntries((options.value.entity.queryParamDataSource ?? []).map(row => [row.key, row.value as string[]]))
  } else if (client.type === MCP_CLIENT_TYPE.STDIO) {
    const stdio = client as StdioMcpClientTransportMetadata
    stdio.env = Object.fromEntries((options.value.entity.envDataSource ?? []).map(row => [row.key, String(row.value)]))
  }
}

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

async function loadGroup() {
  const result = await dataDictionaryService.page({
    number: 1,
    size: 1000,
    ['filter_[code_like]']: MCP_GROUP_CODE_PREFIX,
    ['filter_[enabled_eq]']: YES_OR_NO_TYPE.YES,
  })
  options.value.groupOptions = result.data?.elements || []
  console.info(options.value.groupOptions)
}

async function preMounted() {
  options.value.spinning = true
  const enums: RestResult<EnumBucketsResponseBody> =
    await ResourceServerService.getServiceEnumerates({
      [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: [
        {id: "YesOrNo"},
        {id: "TimeUnitEnum"},
      ],
      [SYSTEM_MODULE_NAME.AI_SERVER]: [
        {id: "McpPackageAuthModeEnum"},
        {id: "PackageOriginEnum"},
        {id: "PackageTypeEnum"},
        {id: "McpClientTypeEnum"},
      ],
    })
  if (enums.data) {
    const resourceServer = enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER] ?? {}
    const aiServer = enums.data[SYSTEM_MODULE_NAME.AI_SERVER] ?? {}

    options.value.originOptions = (aiServer['PackageOriginEnum'] || []) as NameValueEnumMetadata<number>[]
    options.value.yesOrNoOptions = (resourceServer['YesOrNo'] || []) as NameValueEnumMetadata<number>[]
    options.value.timeOptions = (resourceServer['TimeUnitEnum'] || []) as NameValueEnumMetadata<string>[]

    options.value.authModeOptions = (aiServer['McpPackageAuthModeEnum'] || []) as NameValueEnumMetadata<number>[]
    options.value.typeOptions = (aiServer['PackageTypeEnum'] || []) as NameValueEnumMetadata<number>[]
    options.value.clientTypeOptions = (aiServer['McpClientTypeEnum'] || []) as NameValueEnumMetadata<string>[]
  }
  await loadGroup()
  for (const icon of options.value.icons) {
    const iconData:IconfontJson = await loadIcon(import.meta.env.VITE_APP_SITE_URL + icon)
    options.value.iconOptions.push(iconData)
  }
  options.value.spinning = false
}

function setPageTitle(title: string, entity: McpPackageEntity | McpPackageSavePayload) {
  if (entity.id) {
    return title + ' (' + entity.name + ')'
  }
  return title
}

</script>

<template>
  <div>
    <l-basic-form
      operation-data-trace-target="tb_ai_mcp_package"
      :pre-mounted="preMounted"
      :post-get-entity="postGetEntity"
      :title-text="setPageTitle"
      :redirect="{name: MCP_PACKAGE_ROUTE.HOME}"
      :pre-submit="preSubmit"
      :service="service"
      v-model:entity="options.entity"
      :spinning="options.spinning"
    >
      <template #rowLayout>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="name"
            :label="globalProperties.$t('common.name')"
            :rules="[{required: true}]"
          >
            <a-input v-model:value="options.entity.name" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="packageKey"
            :label="globalProperties.$t('aiServer.mcpPackage.packageKey')"
            :rules="[{required: true}]"
          >
            <a-input
              v-model:value="options.entity.packageKey"
              :disabled="globalProperties.$route.query[SYSTEM_CONSTANT.ID_NAME] !== undefined"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="icon"
            :label="globalProperties.$t('common.icon')"
          >
            <l-icon-select
              class="w-full"
              :mode="ICON_SELECT_MODE.AVATAR"
              v-model:value="options.entity.icon"
              :options="options.iconOptions"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="group"
            :label="globalProperties.$t('common.group')"
          >
            <a-select
              class="w-full"
              :value="options.entity.group?.code"
              :options="options.groupOptions"
              :field-names="{ label: 'name', value: 'code' }"
              allow-clear
              @change="(_value:string,option:DataDictionaryMetadata) => options.entity.group = option"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="authMode"
            :label="globalProperties.$t('aiServer.mcpPackage.authMode')"
            :rules="[{required: true}]"
          >
            <a-select
              class="w-full"
              v-model:value="options.entity.authMode"
              :options="options.authModeOptions"
              :field-names="{label: 'name'}"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="origin"
            :label="globalProperties.$t('aiServer.mcpPackage.origin')"
            :rules="[{required: true}]"
          >
            <a-select
              class="w-full"
              v-model:value="options.entity.origin"
              :options="options.originOptions"
              :field-names="{label: 'name'}"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="tags"
            :label="globalProperties.$t('aiServer.mcpPackage.tags')"
          >
            <a-select
              class="w-full"
              mode="tags"
              max-tag-count="responsive"
              v-model:value="options.entity.tags"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="type"
            :label="globalProperties.$t('common.type')"
            :rules="[{required: true}]"
          >
            <a-select
              class="w-full"
              v-model:value="options.entity.type"
              :options="options.typeOptions"
              :field-names="{label: 'name'}"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="dynamicActivation"
            :label="globalProperties.$t('aiServer.mcpPackage.dynamicActivation')"
            :rules="[{required: true}]"
          >
            <a-select
              class="w-full"
              v-model:value="options.entity.dynamicActivation"
              :options="options.yesOrNoOptions"
              :field-names="{label: 'name'}"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="initializeTimeout"
            :label="globalProperties.$t('aiServer.mcpPackage.initializeTimeout')"
          >
            <a-space-compact block>
              <a-input-number class="w-full" v-model:value="options.entity.initializeTimeout.value" :min="1" />
              <a-select
                class="w-auto"
                :options="options.timeOptions"
                :field-names="{label: 'name'}"
                v-model:value="options.entity.initializeTimeout.unit"
              />
            </a-space-compact>

          </a-form-item>
        </a-col>
        <a-col :span="24">
          <a-form-item
            name="summary"
            :label="globalProperties.$t('aiServer.mcpPackage.summary')"
          >
            <a-textarea
              v-model:value="options.entity.summary"
              :rows="4"
              show-count
              :maxlength="512"
            />
          </a-form-item>
        </a-col>
        <a-col :span="24">
          <a-form-item
            name="additionalInformation"
            :label="globalProperties.$t('aiServer.mcpPackage.additionalInformation')"
          >
            <a-textarea
              v-model:value="options.entity.additionalInformation"
              :rows="4"
              show-count
              :maxlength="512"
            />
          </a-form-item>
        </a-col>
      </template>

      <a-divider class="m-0 mb-md" orientation="left" plain>
        <a-space>
          <icon-font class="icon align" type="loncra-sliders-horizontal" />
          {{ globalProperties.$t('aiServer.mcpPackage.client') }}
          <a-flex class="shrink-0">
            <a-segmented
              v-model:value="options.entity.metadata.client.type"
              :options="options.clientTypeOptions.map(c => ({label: c.name, value: c.value}))"
              @change="(value: string) => options.entity.metadata.client.type = value"
            />
          </a-flex>
        </a-space>
      </a-divider>
      <a-row :gutter="[configProviderStore.getToken().sizeMD]">
        <template v-if="MCP_CLIENT_HTTP_TYPE_VALUE.includes(options.entity.metadata.client.type)">
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item
              :name="['metadata', 'client','baseUrl']"
              :label="globalProperties.$t('aiServer.mcpPackage.baseUrl')"
              :rules="[{required: true}]"
            >
              <a-space-compact block>
                <a-input v-model:value="(options.entity.metadata.client as SseMcpClientTransportMetadata).baseUrl" />
                <a-input class="w-auto" v-model:value="(options.entity.metadata.client as SseMcpClientTransportMetadata).endpoint" />
              </a-space-compact>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item :label="globalProperties.$t('aiServer.mcpPackage.timeout')">
              <a-space-compact block>
                <a-input-number class="w-full" v-model:value="(options.entity.metadata.client as SseMcpClientTransportMetadata).timeout.value" :min="1" />
                <a-select
                  class="w-auto"
                  :options="options.timeOptions"
                  :field-names="{label: 'name'}"
                  v-model:value="(options.entity.metadata.client as SseMcpClientTransportMetadata).timeout.unit"
                />
              </a-space-compact>
            </a-form-item>
          </a-col>
          <template v-if="options.entity.metadata.client.type === MCP_CLIENT_TYPE.STREAMABLE_HTTP">
            <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
              <a-form-item
                :name="['metadata', 'client', 'openConnectionOnStartup']"
                :label="globalProperties.$t('aiServer.mcpPackage.openConnectionOnStartup')"
              >
                <a-select
                  class="w-full"
                  v-model:value="(options.entity.metadata.client as StreamableHttpMcpClientTransportMetadata).openConnectionOnStartup"
                  :options="options.yesOrNoOptions"
                  :field-names="{label: 'name'}"
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
              <a-form-item
                :name="['metadata', 'client', 'resumableStreams']"
                :label="globalProperties.$t('aiServer.mcpPackage.resumableStreams')"
              >
                <a-select
                  class="w-full"
                  v-model:value="(options.entity.metadata.client as StreamableHttpMcpClientTransportMetadata).resumableStreams"
                  :options="options.yesOrNoOptions"
                  :field-names="{label: 'name'}"
                />
              </a-form-item>
            </a-col>
          </template>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <l-key-value-table
              icon="loncra-form"
              @change="(item, data) => (options.entity.metadata.client as SseMcpClientTransportMetadata).headers = Object.fromEntries(data.map(row => [row.key, row.value as string[]]))"
              ref="headerTableRef"
              multiple-value
              :form-item-name-prefix="['headerDataSource']"
              :title="globalProperties.$t('aiServer.mcpPackage.headers')"
              v-model:value="options.entity.headerDataSource"
            />
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <l-key-value-table
              icon="loncra-variable"
              multiple-value
              @change="(item, data) => (options.entity.metadata.client as SseMcpClientTransportMetadata).queryParams = Object.fromEntries(data.map(row => [row.key, row.value as string[]]))"
              ref="queryParamTableRef"
              :form-item-name-prefix="['queryParamDataSource']"
              :title="globalProperties.$t('aiServer.mcpPackage.queryParams')"
              v-model:value="options.entity.queryParamDataSource"
            />
          </a-col>
        </template>
        <template v-else>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item
              :name="['metadata', 'client','command']"
              :label="globalProperties.$t('aiServer.mcpPackage.command')"
              :rules="[{required: true}]"
            >
              <a-input v-model:value="(options.entity.metadata.client as StdioMcpClientTransportMetadata).command" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item
              :name="['metadata', 'client','args']"
              :label="globalProperties.$t('aiServer.mcpPackage.args')"
              :rules="[{required: true}]"
            >
              <a-select
                class="w-full"
                mode="tags"
                v-model:value="(options.entity.metadata.client as StdioMcpClientTransportMetadata).args"
              />
            </a-form-item>
          </a-col>
          <a-col :span="24" >
            <l-key-value-table
              ref="envTableRef"
              @change="(item, data) => (options.entity.metadata.client as StdioMcpClientTransportMetadata).env = Object.fromEntries(data.map(row => [row.key, row.value as string]))"
              :title="globalProperties.$t('aiServer.mcpPackage.env')"
              :form-item-name-prefix="['envDataSource']"
              icon="loncra-variable"
              v-model:value="options.entity.envDataSource"
            />
          </a-col>
        </template>
        <a-col :span="24" :class="['mt-lg', options.entity.id ? undefined : 'mb-lg']">
          <l-mcp-clarify-policy-table
            :mcp-client="options.entity.metadata.client"
            :form-item-name-prefix="['metadata', 'clarifyPolicies']"
            v-model:value="options.entity.metadata.clarifyPolicies"
          />
        </a-col>
      </a-row>
    </l-basic-form>
  </div>
</template>
