<script setup lang="ts">
import {AiSkillPackageService, ResourceServerService} from '@/apis'
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from 'vue'
import type {
  DataDictionaryMetadata,
  PageRequest,
  RestResult,
  SkillPackageEntity,
  TotalPage,
} from '@/types/apis'
import {
  DATA_DICTIONARY_ALL_CODE,
  DATA_STATUS,
  DEFAULT_PAGE_RESULT_VALUE,
  ICON_SELECT_MODE,
  PACKAGE_TYPE,
  SKILL_GROUP_CODE_PREFIX,
} from '@/constants'
import {addAllDataDictionary, requireNonNullOrUndefined} from '@/utils'
import LIconSelect from '@/components/basic/IconSelect.vue'

defineOptions({
  name: 'LAgentHubSkill',
})

const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
  getCurrentInstance(),
).appContext.config.globalProperties

const service = new AiSkillPackageService()

const loading = ref<boolean>(false)

const dataSource = ref<TotalPage<SkillPackageEntity>>({
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
    const param: PageRequest = {
      ...request,
      'filter_[status_eq]': DATA_STATUS.RELEASE,
      'filter_[type_eq]': PACKAGE_TYPE.HUB,
    }

    if (activeGroupCode.value !== DATA_DICTIONARY_ALL_CODE) {
      param['filter_[category.code_jeq]'] = activeGroupCode.value
    }
    const result: RestResult<TotalPage<SkillPackageEntity>> = await service.page(param)

    if (result.data) {
      dataSource.value = result.data
    }
  } finally {
    loading.value = false
  }
}

async function mounted() {
  const result: RestResult<Record<string, DataDictionaryMetadata[]>> =
    await ResourceServerService.findDataDictionariesByCodes([SKILL_GROUP_CODE_PREFIX])
  if (!result.data) {
    return
  }
  groups.value = addAllDataDictionary(result.data[SKILL_GROUP_CODE_PREFIX] || [])
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
        <a-flex vertical class="flex-[1_1_0] overflow-y-auto" gap="large" v-if="(dataSource.elements || []).length > 0">
          <a-card :key="record.id" v-for="record of dataSource.elements || []" :title="record.name"
                  size="small">
            <template #extra>
              <a-button size="small" type="primary" disabled>
                <template #icon>
                  <icon-font type="loncra-download"/>
                </template>
                {{ globalProperties.$t('agent.hub.install') }}
              </a-button>
            </template>
            <a-flex gap="middle" vertical class="w-full">
              <a-flex gap="middle" class="w-full">
                <l-icon-select :mode="ICON_SELECT_MODE.AVATAR" preview v-model:value="record.icon"/>
                <a-flex gap="middle" vertical class="w-full">
                  <a-flex justify="space-between" align="center">
                    <a-space wrap class="flex-1">
                      <a-tag :key="tag" v-for="tag of record.tags">
                        {{ tag }}
                      </a-tag>
                    </a-space>
                    <a-space class="shrink-0" size="small">
                      <a-typography-text v-if="record.latestVersion" type="secondary" class="text-xs">
                        {{ record.latestVersion }}
                      </a-typography-text>
                      <a-typography-text type="secondary" class="text-xs">
                        {{ globalProperties.$dayjs(record.creationTime).fromNow() }}
                      </a-typography-text>
                    </a-space>
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
        <a-flex v-else justify="center" align="center" class="size-full">
          <a-empty />
        </a-flex>
      </a-spin>
    </template>
  </a-tabs>
</template>
