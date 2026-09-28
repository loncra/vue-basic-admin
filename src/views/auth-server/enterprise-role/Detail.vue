<script setup lang="ts">
import {ref} from 'vue'
import type {EnterpriseRoleEntity, ResourceEntity} from '@loncra/client/auth'
import {CrudDetailPage, CrudHomePage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {resourceHomePage} from '@/views/auth-server/resource/resource.home.page'
import {
  fetchEnterpriseResources,
  RESOURCE_VARIANT,
  resourceTreeSelection,
} from '@/views/auth-server/resource/resource.page'
import {enterpriseRoleCore} from './enterprise-role.page'
import {enterpriseRoleDetailPage} from './enterprise-role.detail.page'

/**
 * 企业角色详情页薄壳：字段、枚举显示、跨列数、操作记录都在声明里；
 * 这里留三件宿主的事 —— 主键（pro 不认路由）、标题、离场，外加「独立资源」那张表。
 */
defineOptions({
  name: 'AuthServerEnterpriseRoleDetail',
})

const detailRef = ref<{entity?: EnterpriseRoleEntity}>()

/** 详情必须有 id：缺了就摆清错误字段跳 400，且**壳不挂载**；**id 由它一并带出来**（快照） */
const {ok, id} = useRequiredQuery()

/** 标题：旧 `title-text` 是 `标题 (角色名)` */
useEntityPageTitle(() => detailRef.value?.entity?.name)

/** 记录被删 ⇒ 回列表 + 关 tab（旧 `BasicDetail` 自己干的） */
const {onStale} = usePageExit({redirect: enterpriseRoleCore.routes?.home})

/** 资源选择器的实例：树形勾选要按它当前的 `dataSource` 找祖先 / 子节点 */
const resourcePickerRef = ref<{dataSource?: ResourceEntity[]}>()
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="enterpriseRoleDetailPage"
    @stale="onStale"
  >
    <!-- 旧 `BasicDetail` 的同名插槽：描述列表之后、操作记录之前 -->
    <template #afterDescriptions="{entity}">
      <a-divider titlePlacement="start" plain>
        <a-space>
          <icon-font class="icon" type="loncra-key-round" />
          {{ $t('authServer.standaloneResource') }}
        </a-space>
      </a-divider>

      <!-- 独立资源：pro 的资源列表声明当**只读选择器**用（旧组件是 `preview` + 全部禁用）；取数口换成 `/resource/find/enterprise` -->
      <crud-home-page
        ref="resourcePickerRef"
        :page="resourceHomePage"
        :variant="RESOURCE_VARIANT.PICKER"
        :record-actions="false"
        :drag="false"
        :pagination="false"
        :title="false"
        :scroll="{x: 'max-content', y: 350}"
        :expand-icon-column-index="2"
        :fetch="fetchEnterpriseResources"
        :row-selection="resourceTreeSelection({
          dataSource: () => resourcePickerRef?.dataSource ?? [],
          selectedIds: () => entity.resourceIds,
          onChange: () => {},
          getCheckboxProps: () => ({disabled: true}),
        })"
      />
    </template>
  </crud-detail-page>
</template>
