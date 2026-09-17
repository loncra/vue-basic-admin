<script setup lang="ts">
import {ref} from 'vue'
import type {ResourceEntity} from '@loncra/client/auth'
import {CrudFormPage} from '@/components/basic/page'
import {
  RESOURCE_VARIANT,
  resourcePage,
  resourceTreeSelection,
} from '@/views/auth-server/resource/resource.page'
import {rolePage} from './role.page'

/**
 * 新增/编辑页薄壳。
 * 字段、提交、标题、父角色继承都由声明（role.page.ts）管；「独立资源」选择器是逃生内容。
 */
defineOptions({
  name: 'AuthServerRoleForm',
})

const resourcePickerRef = ref<{
  fetchDataSource?: () => void
  clearDataSource?: () => void
  dataSource?: ResourceEntity[]
}>()
const resourceQuery = ref<Record<string, unknown>>({
  'filter_[enabled_eq]': '1',
  'filter_[sources_jin]': [],
})

/** 声明里的 preMounted / postGetEntity 通过 contextExtra 拿到这两个 ref */
const contextExtra = {resourceTable: resourcePickerRef, resourceQuery}
</script>

<template>
  <crud-form-page :page="rolePage" :context-extra="contextExtra" v-slot="{entity}">
    <a-divider class="m-0 mb-md" orientation="left" plain>
      <a-space>
        <icon-font class="icon" type="loncra-key-round" />
        {{ $t('authServer.standaloneResource') }}
      </a-space>
    </a-divider>

    <crud-home-page
      ref="resourcePickerRef"
      :page="resourcePage"
      :variant="RESOURCE_VARIANT.PICKER"
      :record-actions="false"
      :drag="false"
      :immediate="false"
      :pagination="false"
      :scroll="{x: 'max-content', y: 350}"
      :expand-icon-column-index="2"
      hide-title
      root-class="mb-md"
      :query="resourceQuery"
      :row-selection="resourceTreeSelection({
        dataSource: () => resourcePickerRef?.dataSource ?? [],
        selectedIds: () => entity.resourceIds,
        onChange: (ids) => { entity.resourceIds = ids },
      })"
    />
  </crud-form-page>
</template>
