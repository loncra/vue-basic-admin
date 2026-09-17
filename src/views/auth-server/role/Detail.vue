<script setup lang="ts">
import {ref, watch} from 'vue'
import type {ResourceEntity} from '@loncra/client/auth'
import {CrudDetailPage} from '@/components/basic/page'
import LResourceTable from '@/components/auth-server/ResourceTable.vue'
import {rolePage} from './role.page'

/**
 * 详情页薄壳。
 * 声明（role.page.ts）管基本信息；「独立资源」子树是声明管不到的部分，作为逃生内容留在这里。
 */
defineOptions({
  name: 'AuthServerRoleDetail',
})

const detailPageRef = ref<{entity?: ResourceEntity & {id?: number}}>()
const resourceTableRef = ref<InstanceType<typeof LResourceTable>>()
const resourceQuery = ref<Record<string, unknown>>({
  'filter_[enabled_eq]': '1',
  'filter_[sources_jin]': [],
})

/** 声明里的 postGetEntity 通过 contextExtra 拿到这两个 ref */
const contextExtra = {resourceTable: resourceTableRef, resourceQuery}

// 表格已挂载 且 实体已加载 → 刷新，两种就绪顺序都能覆盖
watch(
  [resourceTableRef, () => detailPageRef.value?.entity?.id],
  () => {
    if (resourceTableRef.value && detailPageRef.value?.entity?.id) {
      resourceTableRef.value.fetchDataSource()
    }
  },
  {immediate: true},
)
</script>

<template>
  <crud-detail-page ref="detailPageRef" :page="rolePage" :context-extra="contextExtra">
    <template #afterDescriptions="{entity}">
      <a-divider orientation="left" plain>
        <a-space>
          <icon-font class="icon" type="loncra-key-round" />
          {{ $t('authServer.standaloneResource') }}
        </a-space>
      </a-divider>

      <l-resource-table
        :immediate="false"
        ref="resourceTableRef"
        :drag="false"
        preview
        hide-title
        :query="resourceQuery"
        :row-selection="{
          fixed: true,
          type: 'checkbox',
          selectedRowKeys: entity.resourceIds,
          getCheckboxProps: () => ({disabled: true}),
        }"
      />
    </template>
  </crud-detail-page>
</template>
