<script setup lang="ts">
import {AiMcpPackageService, DataDictionaryService} from "@/apis";
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from "vue";
import type {
  DataDictionaryMetadata,
  McpPackageEntity,
  PageRequest,
  RestResult,
  TotalPage
} from "@/types/apis";
import {
  DATA_DICTIONARY_ALL_CODE,
  DEFAULT_PAGE_RESULT_VALUE,
  ICON_SELECT_MODE,
  MCP_GROUP_CODE_PREFIX,
  YES_OR_NO_TYPE
} from "@/constants";
import {addAllDataDictionary, requireNonNullOrUndefined} from "@/utils";
import LIconSelect from "@/components/basic/IconSelect.vue";

defineOptions({
  name: 'LAgentHubMcp',
})

const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
  getCurrentInstance(),
).appContext.config.globalProperties

const service = new AiMcpPackageService()
const dataDictionaryService = new DataDictionaryService()

const loading = ref<boolean>(false)

const dataSource = ref<TotalPage<McpPackageEntity>>({
  ...DEFAULT_PAGE_RESULT_VALUE,
  totalCount: 0,
  totalPages: 0,
})

const groups = ref<DataDictionaryMetadata[]>([])
const activeGroupCode = ref<string>()

function onTabChange(key: string) {
  activeGroupCode.value = key
  loadData({ number: 1, size: 10 }) // 按分组筛时把 key 带进 filter
}

function onChangePage(page: number, pageSize: number) {
  loadData({
    number: page,
    size: pageSize,
  })
}

async function loadData(request:PageRequest) {
  loading.value = true
  try {
    const param:PageRequest = {
      ...request,
      'filter_[status_eq]':20,
      'filter_[type_eq]':20,
    }

    if (activeGroupCode.value !== DATA_DICTIONARY_ALL_CODE) {
      param['filter_[category.code_jeq]'] = activeGroupCode.value
    }
    const result:RestResult<TotalPage<McpPackageEntity>> = await service.page(param)

    if (result.data) {
      dataSource.value = result.data
    }
  } finally {
    loading.value = false
  }
}

async function mounted () {
  const result = await dataDictionaryService.page({
    number: 1,
    size: 1000,
    ['filter_[code_like]']: MCP_GROUP_CODE_PREFIX,
    ['filter_[enabled_eq]']: YES_OR_NO_TYPE.YES,
  })

  groups.value = addAllDataDictionary(result.data?.elements || [])
  const first = groups.value.at(0)
  if (first) {
    onTabChange(first.code)
  }
}

onMounted(mounted)

</script>

<template>
    <a-tabs
      @change="onTabChange"
      tab-placement="left"
      :classes="{
        root: 'min-h-0 h-full',
        body: 'min-h-0 h-full overflow-hidden',
        content: 'min-h-0 h-full ',
      }"
      :items="groups.map(g => ({label:g.name, key:g.code,value:g.value, metadata:g.metadata}))"
    >
      <template #contentRender>
        <a-spin :spinning="loading" class="size-full-spin">
          <a-flex vertical class="flex-[1_1_0] overflow-y-auto" gap="large">
            <a-card :key="record.id" v-for="record of dataSource.elements || []" :title="record.name" size="small" >
              <template #extra>
                <a-button size="small" type="primary">
                  <template #icon>
                    <icon-font type="loncra-download"/>
                  </template>
                  安装
                </a-button>
              </template>
              <a-flex gap="middle" vertical class="w-full">
                <a-flex gap="middle" class="w-full">
                  <l-icon-select :mode="ICON_SELECT_MODE.AVATAR" preview v-model:value="record.icon" />
                  <a-flex gap="middle" vertical class="w-full">
                    <a-flex justify="space-between" align="center">
                      <a-space wrap class="flex-1" >
                        <a-tag :key="tag" v-for="tag of record.tags">
                          {{ tag }}
                        </a-tag>
                      </a-space>
                      <a-typography-text type="secondary" class="shrink-0 text-xs">
                        {{ globalProperties.$dayjs(record.creationTime).fromNow() }}
                      </a-typography-text>
                    </a-flex>
                    <div class="max-h-30 w-full overflow-auto">
                      {{ record.summary }}
                    </div>
                  </a-flex>
                </a-flex>
              </a-flex>
            </a-card>
            <a-pagination
              size="small"
              align="center"
              :current="dataSource.number"
              hide-on-single-page
              :pageSize="dataSource.size"
              :total="dataSource.totalCount"
              @change="onChangePage"
            />
          </a-flex>
        </a-spin>
      </template>
    </a-tabs>
</template>
