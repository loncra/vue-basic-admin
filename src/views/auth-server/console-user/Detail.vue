<script setup lang="ts">
import {ref, watch} from 'vue'
import type {ConsoleUserSavePayload, ResourceEntity, RoleEntity} from '@loncra/client/auth'
import {CrudDetailPage, CrudHomePage, type CrudHomePageExpose} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {consoleUserCore} from './console-user.page'
import {consoleUserDetailPage} from './console-user.detail.page'
import {resourceHomePage} from "@/views/auth-server/resource/resource.home.page.ts";
import {RESOURCE_VARIANT} from "@/views/auth-server/resource/resource.page.ts";
import {roleHomePage} from "@/views/auth-server/role/role.home.page.ts";
import {applySources, ROLE_VARIANT} from "@/views/auth-server/role/role.page.ts";

/** 控制台用户详情薄壳：字段、标签、格式化、跨列数都在声明里；标题用实体名拼（旧 `titleText`） */
defineOptions({
  name: 'AuthServerConsoleUserDetail',
})

const detailRef = ref<{entity?: ConsoleUserSavePayload}>()
/** 角色选择器：要读它加载完的 `dataSource`（用户的 roleIds 去里面找实体） */
const rolePickerRef = ref<CrudHomePageExpose<RoleEntity>>()
/** 资源表：查询条件由角色的 sources 决定，取数也由这里发起 */
const resourcePickerRef = ref<CrudHomePageExpose<ResourceEntity>>()

const resourceQuery = ref<Record<string, unknown>>({
  'filter_[enabled_eq]': '1',
  'filter_[sources_jin]': [],
})

/**
 * 用户的角色 → 角色的 `sources` → 资源表的查询条件（**只查这个用户通过角色真正拥有的来源**，
 * 不是全量查出来再跟 `resourceIds` 对）。
 *
 * - 两个源就绪顺序不定（角色表挂载 / 实体加载谁先都可能）⇒ watch 两个源，齐了才动手；
 * - ⚠️ **监听的必须是 `dataSource` 这个值，不能是 `rolePickerRef` 本身**：模板 ref 的 `.value`
 *   只在子组件挂载时被赋一次（null → 实例），之后**数据到达不会再通知** ⇒ 那样写会在
 *   "表格刚挂载、行还是空的"那次就跑回调，然后永远不再跑（顺序靠运气）；
 *   读 expose 的 `dataSource` 才会跟着数据变（见 `CrudHomePageExpose` 的说明：expose 的是值，响应式不丢）。
 * - `applySources` 是角色页导出的同一个口（sources → `filter_[sources_jin]` + 刷新；
 *   **sources 为空时清空表格、一个字都不查**）—— 别在这儿手写第二份。
 */
watch(
  [() => rolePickerRef.value?.dataSource, () => detailRef.value?.entity?.roleIds],
  () => {
    const roleRows = rolePickerRef.value?.dataSource ?? []
    const roleIds = detailRef.value?.entity?.roleIds ?? []
    if (roleRows.length === 0 || roleIds.length === 0) {
      return
    }
    const sources: unknown[] = []
    for (const role of roleRows) {
      if (role.id == null || !roleIds.includes(role.id)) {
        continue
      }
      // `sources` 是联合类型（`string[] | NameValueEnumMetadata[]`）⇒ 用显式循环，别让 flatMap 去推断
      if (Array.isArray(role.sources)) {
        sources.push(...role.sources)
      }
    }
    applySources({extra: {resourceQuery, resourceTable: resourcePickerRef}}, sources)
  },
  {immediate: true},
)

/** 详情必须有 id：缺了就摆清错误字段跳 400，且**壳不挂载**；**id 由它一并带出来**（快照 —— 别再自己读 route，旧 `BasicDetail` 的 `queryFields` 就是这件事） */
const {ok, id} = useRequiredQuery()

useEntityPageTitle(() => detailRef.value?.entity?.realName)

/** 记录被删 ⇒ 回列表 + 关 tab（旧 `BasicDetail` 自己干的） */
const {onStale} = usePageExit({redirect: consoleUserCore.routes?.home})
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="consoleUserDetailPage"
    @stale="onStale"
  >
    <template #afterDescriptions="{entity}">
      <a-divider class="mb-md" titlePlacement="start" plain>
        <a-space>
          <icon-font class="icon" type="loncra-users-round" />
          {{ $t('authServer.userRole') }}
        </a-space>
      </a-divider>

      <crud-home-page
        ref="rolePickerRef"
        :page="roleHomePage"
        :variant="ROLE_VARIANT.PICKER"
        :record-actions="false"
        :drag="false"
        :pagination="false"
        plain
        :scroll="{x: 'max-content', y: 350}"
        :title="false"
        :row-selection="{
          fixed: true,
          type: 'checkbox',
          selectedRowKeys: entity.roleIds,
          getCheckboxProps: () => ({disabled: true}),
        }"
      />

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
        :pagination="false"
        :scroll="{x: 'max-content', y: 350}"
        :expand-icon-column-index="2"
        :title="false"
        plain
        :immediate="false"
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
