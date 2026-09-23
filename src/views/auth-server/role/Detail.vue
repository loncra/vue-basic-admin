<script setup lang="ts">
import {ref, watch} from 'vue'
import type {ResourceEntity} from '@loncra/client/auth'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {RESOURCE_VARIANT} from '@/views/auth-server/resource/resource.page'
import {resourceHomePage} from '@/views/auth-server/resource/resource.home.page'
import {roleCore} from './role.page'
import {roleDetailPage} from './role.detail.page'

/**
 * 详情页薄壳。
 * 声明（role.page.ts）管基本信息；「独立资源」子树（只读）是声明管不到的部分，作为逃生内容留在这里。
 * 标题（旧 `titleText`）改由这里用 `useEntityPageTitle` 拼 —— pro 的壳不解析标题。
 */
defineOptions({
  name: 'AuthServerRoleDetail',
})

const detailPageRef = ref<{entity?: ResourceEntity & {id?: number}}>()

/** 详情必须有 id：缺了就摆清错误字段跳 400，且**壳不挂载**；**id 由它一并带出来**（快照 —— 别再自己读 route，旧 `BasicDetail` 的 `queryFields` 就是这件事） */
const {ok, id} = useRequiredQuery()

const resourcePickerRef = ref<{fetchDataSource?: () => void}>()
const resourceQuery = ref<Record<string, unknown>>({
  'filter_[enabled_eq]': '1',
  'filter_[sources_jin]': [],
})

/** 声明里的 postGetEntity 通过 contextExtra 拿到这两个 ref */
const contextExtra = {resourceTable: resourcePickerRef, resourceQuery}

/** 标题：带角色名（旧的 `titleText` 就是无条件加 `(name)`） */
useEntityPageTitle(() => detailPageRef.value?.entity?.name)

/** 记录被删 ⇒ 回列表 + 关 tab（旧 `BasicDetail` 自己干的） */
const {onStale} = usePageExit({redirect: roleCore.routes?.home})

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
  <crud-detail-page
    v-if="ok"
    ref="detailPageRef"
    :id="id"
    :page="roleDetailPage"
    :context-extra="contextExtra"
    @stale="onStale"
  >
    <template #afterDescriptions="{entity}">
      <a-divider titlePlacement="start" plain>
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
        :title="false"
        plain
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
