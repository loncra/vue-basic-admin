<script setup lang="ts">
import {ref} from 'vue'
import type {ResourceEntity} from '@loncra/client/auth'
import {CrudFormPage} from '@/components/basic/page'
import LResourceTable from '@/components/auth-server/ResourceTable.vue'
import {rolePage} from './role.page'

/**
 * 新增/编辑页薄壳。
 * 字段、提交、标题、父角色继承都由声明（role.page.ts）管；「独立资源」子树是逃生内容。
 */
defineOptions({
  name: 'AuthServerRoleForm',
})

const formPageRef = ref<{entity?: Record<string, unknown>}>()
const resourceTableRef = ref<InstanceType<typeof LResourceTable>>()
const resourceDataSource = ref<ResourceEntity[]>([])
const resourceQuery = ref<Record<string, unknown>>({
  'filter_[enabled_eq]': '1',
  'filter_[sources_jin]': [],
})

/** 声明里的 preMounted / postGetEntity 通过 contextExtra 拿到这两个 ref */
const contextExtra = {resourceTable: resourceTableRef, resourceQuery}
</script>

<template>
  <crud-form-page ref="formPageRef" :page="rolePage" :context-extra="contextExtra" v-slot="{entity}">
    <a-divider class="m-0 mb-md" orientation="left" plain>
      <a-space>
        <icon-font class="icon" type="loncra-key-round" />
        {{ $t('authServer.standaloneResource') }}
      </a-space>
    </a-divider>

    <l-resource-table
      ref="resourceTableRef"
      :immediate="false"
      :drag="false"
      preview
      hide-title
      root-class="mb-md"
      :query="resourceQuery"
      :resource-ids="entity.resourceIds"
      @update:resourceIds="(ids: number[]) => { entity.resourceIds = ids }"
      v-model:data-source="resourceDataSource"
    />
  </crud-form-page>
</template>
