<script setup lang="ts">
import {ref} from 'vue'
import {useRoute} from 'vue-router'
import type {TableProps} from 'antdv-next'
import type {ConsoleUserSavePayload, RoleEntity} from '@loncra/client/auth'
import {AUTH_SERVER_AUTHENTICATION_TYPE} from '@loncra/client/auth'
import {CrudFormPage, CrudHomePage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {SYSTEM_CONSTANT} from '@/constants'
import {ROLE_VARIANT} from '@/views/auth-server/role/role.page'
import {roleHomePage} from '@/views/auth-server/role/role.home.page'
import {RESOURCE_VARIANT} from '@/views/auth-server/resource/resource.page'
import {resourceHomePage} from '@/views/auth-server/resource/resource.home.page'
import {consoleUserCore} from './console-user.page'
import {consoleUserFormPage} from './console-user.form.page'

/**
 * 控制台用户表单的**薄壳**。
 * 字段、校验、编辑态禁用、重置都在声明（`console-user.form.page.ts`）里；
 * 这里留声明管不到的三块：分隔标题、两个内嵌选择器、备注（默认插槽里，位置与旧页面一致），
 * 外加标题（旧 `titleText`）与主键（pro 的壳不认路由）。
 */
defineOptions({
  name: 'AuthServerConsoleUserForm',
})

const route = useRoute()
const formRef = ref<{entity?: ConsoleUserSavePayload}>()
/** pro 的壳不认路由：主键由页壳取出来传进去（没有 = 新增） */
/** 主键：**进页面那一刻取一次**（快照）。别写 `computed` —— 那样 id 会跟着"当前路由"走：本实例若在路由切走后被重新挂载/重新激活，就会拿**别人的 id** 去取自己的数据 */
const id = route.query[SYSTEM_CONSTANT.ID_NAME] as number | undefined

/** 两个选择器的固定查询：只列启用的、且支持控制台登录的 */
const roleQuery = {
  'filter_[enabled_eq]': '1',
  'filter_[sources_jin]': AUTH_SERVER_AUTHENTICATION_TYPE.CONSOLE,
}
const resourceQuery = {...roleQuery}

/** 标题：编辑态带真实姓名（与旧 `titleText` 一致） */
useEntityPageTitle(() => (formRef.value?.entity?.id ? formRef.value?.entity?.realName : undefined))

/** 保存成功后的去向（编辑回列表 / 新增按偏好；关 tab + 记住偏好）—— pro 的壳只 emit('success') */
const {onSuccess, onStale, formKey} = useFormSuccessBack({
  redirect: consoleUserCore.routes?.home,
  entity: () => formRef.value?.entity,
})

/**
 * 勾了角色，把它带的资源也一并勾上（旧实现的行为，别丢）。
 * 实体来自表单壳的默认插槽，所以写成工厂：模板里 `roleSelection(entity)`。
 */
function roleSelection(entity: ConsoleUserSavePayload) {
  const onChange: NonNullable<TableProps['rowSelection']>['onChange'] = (_selectedRowKeys, selectedRows) => {
    const roles = selectedRows as RoleEntity[]
    entity.roleIds = roles.flatMap((r) => (r.id != null ? [r.id] : []))
    entity.resourceIds = [
      ...new Set([...(entity.resourceIds ?? []), ...roles.flatMap((r) => r.resourceIds ?? [])]),
    ]
  }
  return {type: 'checkbox', selectedRowKeys: entity.roleIds, onChange}
}
</script>

<template>
  <crud-form-page
    ref="formRef"
    :key="formKey"
    :id="id"
    :page="consoleUserFormPage"
    @success="onSuccess"
    @stale="onStale"
    v-slot="{entity}"
  >
    <a-divider class="m-0 mb-md" titlePlacement="start" plain>
      <a-space>
        <icon-font class="icon" type="loncra-users-round" />
        {{ $t('authServer.userRole') }}
      </a-space>
    </a-divider>

    <crud-home-page
      :page="roleHomePage"
      :variant="ROLE_VARIANT.PICKER"
      :record-actions="false"
      :query="roleQuery"
      plain
      :row-selection="roleSelection(entity)"
      :title="false"
    />

    <a-divider titlePlacement="start" class="mb-md mt-md" plain>
      <a-space>
        <icon-font class="icon" type="loncra-key-round" />
        {{ $t('authServer.standaloneResource') }}
      </a-space>
    </a-divider>

    <crud-home-page
      :page="resourceHomePage"
      :variant="RESOURCE_VARIANT.PICKER"
      :record-actions="false"
      :drag="false"
      :pagination="false"
      :scroll="{x: 'max-content', y: 350}"
      :expand-icon-column-index="2"
      :query="resourceQuery"
      :row-selection="{type: 'checkbox', selectedRowKeys: entity.resourceIds}"
      :title="false"
      plain
      :classes="{header: 'mb-0!', 'table.root':'mb-md'}"
    />

    <a-form-item name="remark" :label="$t('common.remark')">
      <a-textarea v-model:value="entity.remark" :rows="4" show-count :maxlength="256" />
    </a-form-item>
  </crud-form-page>
</template>
