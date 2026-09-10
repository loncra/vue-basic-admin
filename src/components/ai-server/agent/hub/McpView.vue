<script setup lang="ts">
import {AiMcpPackageService, ResourceServerService} from '@/apis'
import {onMounted, ref} from 'vue'
import type {
  DataDictionaryMetadata,
  McpPackageEntity,
  PageRequest,
  RestResult,
  TotalPage,
  UserPluginInstallResult,
} from '@/types/apis'
import {
  DATA_DICTIONARY_ALL_CODE,
  DEFAULT_PAGE_RESULT_VALUE,
  MCP_GROUP_CODE_PREFIX,
  PLUGIN_TARGET_TYPE,
} from '@/constants'
import {addAllDataDictionary} from '@/utils'
import LAgentHubPluginInfoCard from '@/components/ai-server/agent/hub/PluginInfoCard.vue'

defineOptions({
  name: 'LAgentHubMcp',
})

const props = withDefaults(
  defineProps<{
    installs?: UserPluginInstallResult[]
  }>(),
  {
    installs: () => [],
  },
)

const emits = defineEmits<{
  installed: [result: UserPluginInstallResult]
  uninstalled: [id: number]
}>()

const service = new AiMcpPackageService()

const loading = ref<boolean>(false)
const install = ref<boolean>(false)

const dataSource = ref<TotalPage<McpPackageEntity>>({
  ...DEFAULT_PAGE_RESULT_VALUE,
  totalCount: 0,
  totalPages: 0,
})

const groups = ref<DataDictionaryMetadata[]>([])
const activeGroupCode = ref<string>()

function onTabChange(key: string) {
  activeGroupCode.value = key
  loadData({number: 1, size: 10})
}

function onChangePage(page: number, pageSize: number) {
  loadData({
    number: page,
    size: pageSize,
  })
}

async function loadData(request: PageRequest) {
  loading.value = true
  try {

    if (activeGroupCode.value !== DATA_DICTIONARY_ALL_CODE) {
      request['filter_[category.code_jeq]'] = activeGroupCode.value
    }
    const result: RestResult<TotalPage<McpPackageEntity>> = await service.pageEnabled(request)

    if (result.data) {
      dataSource.value = result.data
    }
  } finally {
    loading.value = false
  }
}

async function mounted() {
  install.value = true
  try {
    const result: RestResult<Record<string, DataDictionaryMetadata[]>> =
      await ResourceServerService.findDataDictionariesByCodes([MCP_GROUP_CODE_PREFIX])
    if (!result.data) {
      return
    }
    groups.value = addAllDataDictionary(result.data[MCP_GROUP_CODE_PREFIX] || [])
    const first = groups.value.at(0)
    if (first) {
      onTabChange(first.code)
    }
  } finally {
    install.value = false
  }

}

onMounted(mounted)
</script>

<template>
  <a-skeleton active :loading="install">
    <a-tabs
      @change="onTabChange"
      tab-placement="left"
      :classes="{
          root: 'min-h-0 h-full',
          body: 'min-h-0 h-full overflow-hidden',
          item: 'pl-0 m-0',
          content: 'min-h-0 h-full ',
        }"
      :items="groups.map(g => ({label:g.name, key:g.code,value:g.value, metadata:g.metadata}))"
    >
      <template #labelRender="{item}">
        <a-flex gap="small">
          <icon-font class="m-0" :type="item?.metadata?.icon || 'loncra-plug-zap'" />
          <span>{{ item.label }}</span>
        </a-flex>
      </template>
      <template #contentRender>
        <a-spin :spinning="loading" class="size-full-spin">
          <l-agent-hub-plugin-info-card
            :data-source="dataSource"
            :installs="props.installs"
            :target-type="PLUGIN_TARGET_TYPE.MCP"
            @change-page="onChangePage"
            @installed="emits('installed', $event)"
            @uninstalled="emits('uninstalled', $event)"
          >
            <template #title="{ record }">
              {{ record.name }}
            </template>
          </l-agent-hub-plugin-info-card>
        </a-spin>
      </template>
    </a-tabs>
  </a-skeleton>
</template>
