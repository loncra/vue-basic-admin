<script setup lang="ts">
import {AiMcpPackageService} from "@/apis";
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from "vue";
import type {McpPackageEntity, PageRequest, RestResult, TotalPage} from "@/types/apis";
import {DEFAULT_PAGE_RESULT_VALUE} from "@/constants";
import {requireNonNullOrUndefined} from "@/utils";

defineOptions({
  name: 'LAgentHubSkill',
})

const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
  getCurrentInstance(),
).appContext.config.globalProperties

const service = new AiMcpPackageService()
const loading = ref<boolean>(false)

const dataSource = ref<TotalPage<McpPackageEntity>>({
  ...DEFAULT_PAGE_RESULT_VALUE,
  totalCount: 0,
  totalPages: 0,
})

function onChangePage(page: number, pageSize: number) {
  loadData({
    number: page,
    size: pageSize,
  })
}

async function loadData(request:PageRequest) {
  loading.value = true
  try {
    const result:RestResult<TotalPage<McpPackageEntity>> = await service.page({
      ...request,
      'filter_[status_eq]':20,
      'filter_[type_eq]':20,
    })

    if (result.data) {
      dataSource.value = result.data
    }
  } finally {
    loading.value = false
  }
}

function mounted () {
  loadData({
    number:1,
    size:10
  })
}

onMounted(mounted)

</script>

<template>
  <a-spin :spinning="loading">
    <a-space orientation="vertical" size="large">
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
            <a-avatar class="shrink-0">
              <template #icon>
                <UserOutlined />
              </template>
            </a-avatar>
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
        :current="dataSource.number"
        hide-on-single-page
        :pageSize="dataSource.size"
        show-total
        :total="dataSource.totalCount"
        @change="onChangePage"
      />
    </a-space>
  </a-spin>
</template>
