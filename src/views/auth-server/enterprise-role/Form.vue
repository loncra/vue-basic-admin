<script setup lang="ts">
import {ref} from 'vue'
import {useRoute} from 'vue-router'
import type {EnterpriseRoleSavePayload, ResourceEntity} from '@loncra/client/auth'
import {CrudFormPage, CrudHomePage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {SYSTEM_CONSTANT} from '@/constants'
import {resourceHomePage} from '@/views/auth-server/resource/resource.home.page'
import {
  fetchEnterpriseResources,
  RESOURCE_VARIANT,
  resourceTreeSelection,
} from '@/views/auth-server/resource/resource.page'
import {enterpriseRoleCore} from './enterprise-role.page'
import {enterpriseRoleFormPage, enterpriseRoleParent} from './enterprise-role.form.page'

/**
 * 企业角色新增/编辑页薄壳。
 * 字段、校验、主键提交、addChild 的继承、重置都在声明（`enterprise-role.form.page.ts`）里；
 * 这里只剩宿主的事：主键、标题、离场，外加「独立资源」选择器（宿主自己的组件）与它的备注框。
 */
defineOptions({
  name: 'AuthServerEnterpriseRoleForm',
})

const route = useRoute()
const formRef = ref<{entity?: EnterpriseRoleSavePayload}>()
/** pro 的壳不认路由：主键由页壳取出来传进去（没有 = 新增） */
/** 主键：**进页面那一刻取一次**（快照）。别写 `computed` —— 那样 id 会跟着"当前路由"走：本实例若在路由切走后被重新挂载/重新激活，就会拿**别人的 id** 去取自己的数据 */
const id = route.query[SYSTEM_CONSTANT.ID_NAME] as number | undefined

/** 标题（旧 `setPageTitle` 三档）：addChild 带进来的父角色名优先，其次编辑态的角色名，最后只有标题 */
useEntityPageTitle(() => {
  const parent = enterpriseRoleParent.value
  if (parent) {
    return parent.name
  }
  return formRef.value?.entity?.id ? formRef.value?.entity?.name : undefined
})

/** 保存成功后的去向（编辑回列表 / 新增按偏好；关 tab + 记住偏好）—— pro 的壳只 emit('success') */
const {onSuccess, onStale, formKey} = useFormSuccessBack({
  redirect: enterpriseRoleCore.routes?.home,
  entity: () => formRef.value?.entity,
})

/** 资源选择器的实例：树形勾选要按它当前的 `dataSource` 找祖先 / 子节点 */
const resourcePickerRef = ref<{dataSource?: ResourceEntity[]}>()
</script>

<template>
  <crud-form-page
    ref="formRef"
    :key="formKey"
    :id="id"
    :page="enterpriseRoleFormPage"
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

    <!-- 独立资源：pro 的资源列表声明当选择器用；取数口换成 `/resource/find/enterprise`（`fetchEnterpriseResources`） -->
    <crud-home-page
      ref="resourcePickerRef"
      class="mb-md"
      :page="resourceHomePage"
      :variant="RESOURCE_VARIANT.PICKER"
      :record-actions="false"
      :drag="false"
      :pagination="false"
      plain
      :title="false"
      :scroll="{x: 'max-content', y: 350}"
      :expand-icon-column-index="2"
      :fetch="fetchEnterpriseResources"
      :row-selection="resourceTreeSelection({
        dataSource: () => resourcePickerRef?.dataSource ?? [],
        selectedIds: () => entity.resourceIds,
        onChange: (ids) => { entity.resourceIds = ids },
      })"
    />

    <a-form-item name="remark" :label="$t('common.remark')">
      <a-textarea v-model:value="entity.remark" :rows="4" show-count :maxlength="256" />
    </a-form-item>
  </crud-form-page>
</template>
