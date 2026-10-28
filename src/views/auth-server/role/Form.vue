<script setup lang="ts">
import {ref} from 'vue'
import type {ResourceEntity, RoleSavePayload} from '@loncra/client/auth'
// ⚠️ `CrudHomePage` 也要显式 import：宿主 `src/components` 下的旧 kit 渲染器被
// unplugin-vue-components 自动注册成了**全局**同名组件 ⇒ 漏 import 不报错、静默跑旧 kit（2026-09-28 踩过）
import {CrudFormPage, CrudHomePage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {RESOURCE_VARIANT, resourceTreeSelection,} from '@/views/auth-server/resource/resource.page'
import {resourceHomePage} from '@/views/auth-server/resource/resource.home.page'
import {roleCore} from './role.page'
import {roleFormPage} from './role.form.page'

/**
 * 新增/编辑页薄壳。
 * 字段、提交、父角色继承都由声明（role.form.page.ts）管；「独立资源」选择器是逃生内容。
 * 标题（旧 `titleText`）改由这里用 `useEntityPageTitle` 拼 —— pro 的壳不解析标题。
 */
defineOptions({
  name: 'AuthServerRoleForm',
})

const formRef = ref<{entity?: RoleSavePayload}>()
const {id} = useRequiredQuery(['id'], {required: false})

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

/** 标题：编辑态带角色名，新增态不带（与旧 `titleText` 一致） */
useEntityPageTitle(() => (formRef.value?.entity?.id ? formRef.value?.entity?.name : undefined))

/** 保存成功后的去向（编辑回列表 / 新增按偏好；关 tab + 记住偏好）—— pro 的壳只 emit('success') */
const {onSuccess, onStale, formKey} = useFormSuccessBack({
  redirect: roleCore.routes?.home,
  entity: () => formRef.value?.entity,
})
</script>

<template>
  <crud-form-page
    ref="formRef"
    :key="formKey"
    :id="id"
    :page="roleFormPage"
    :context-extra="contextExtra"
    @success="onSuccess"
    @stale="onStale"
    v-slot="{entity}"
  >
    <a-divider class="m-0 mb-md" titlePlacement="start" plain>
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
