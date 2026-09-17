<script setup lang="ts">
import {ref, watch} from 'vue'
import type {ResourceEntity} from '@loncra/client/auth'
import {CrudDetailPage} from '@/components/basic/page'
import {RESOURCE_VARIANT} from '@/views/auth-server/resource/resource.page'
import {resourceHomePage} from '@/views/auth-server/resource/resource.home.page'
import {roleDetailPage} from './role.detail.page'

/**
 * 详情页薄壳。
 * 声明（role.page.ts）管基本信息；「独立资源」子树（只读）是声明管不到的部分，作为逃生内容留在这里。
 */
defineOptions({
  name: 'AuthServerRoleDetail',
})

const detailPageRef = ref<{entity?: ResourceEntity & {id?: number}}>()
const resourcePickerRef = ref<{fetchDataSource?: () => void}>()
const resourceQuery = ref<Record<string, unknown>>({
  'filter_[enabled_eq]': '1',
  'filter_[sources_jin]': [],
})

/** 声明里的 postGetEntity 通过 contextExtra 拿到这两个 ref */
const contextExtra = {resourceTable: resourcePickerRef, resourceQuery}

// 表格已挂载 且 实体已加载 → 刷新，两种就绪顺序都能覆盖
watch(
  [resourcePickerRef, () => detailPageRef.value?.entity?.id],
  () => {
    if (resourcePickerRef.value && detailPageRef.value?.entity?.id) {
      resourcePickerRef.value.fetchDataSource?.()
    }
  },
  {immediate: true},
)
</script>

<template>
  <crud-detail-page ref="detailPageRef" :page="roleDetailPage" :context-extra="contextExtra">
    <template #afterDescriptions="{entity}">
      <a-divider orientation="left" plain>
        <a-space>
          <icon-font class="icon" type="loncra-key-round" />
          {{ $t('authServer.standaloneResource') }}
        </a-space>
      </a-divider>

      <crud-home-page
        ref="resourcePickerRef"
        :page="resourceHomePage"
        :variant="RESOURCE_VARIANT.PICKER"
        :record-actions="false"
        :drag="false"
        :immediate="false"
        :pagination="false"
        :scroll="{x: 'max-content', y: 350}"
        :expand-icon-column-index="2"
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
