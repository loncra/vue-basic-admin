<script setup lang="ts">
import type {TableProps} from 'antdv-next'
import type {ConsoleUserSavePayload, RoleEntity} from '@loncra/client/auth'
import {AUTH_SERVER_AUTHENTICATION_TYPE} from '@loncra/client/auth'
import {CrudFormPage} from '@/components/basic/page'
import {CrudHomePage} from '@loncra/antdv-pro'
import {ROLE_VARIANT} from '@/views/auth-server/role/role.page'
import {roleHomePage} from '@/views/auth-server/role/role.home.page'
import {RESOURCE_VARIANT} from '@/views/auth-server/resource/resource.page'
import {resourceHomePage} from '@/views/auth-server/resource/resource.home.page'
import {consoleUserFormPage} from './console-user.form.page'

/**
 * 控制台用户表单的**薄壳**。
 * 字段、校验、编辑态禁用、标题、重置都在声明（`console-user.form.page.ts`）里；
 * 这里只留声明管不到的三块：分隔标题、两个内嵌选择器、备注（它们在默认插槽里，位置与旧页面一致）。
 */
defineOptions({
  name: 'AuthServerConsoleUserForm',
})

/** 两个选择器的固定查询：只列启用的、且支持控制台登录的 */
const roleQuery = {
  'filter_[enabled_eq]': '1',
  'filter_[sources_jin]': AUTH_SERVER_AUTHENTICATION_TYPE.CONSOLE,
}
const resourceQuery = {...roleQuery}

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
  <crud-form-page :page="consoleUserFormPage" v-slot="{entity}">
    <a-divider class="m-0 mb-md" orientation="left" plain>
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
      :row-selection="roleSelection(entity)"
      hide-title
      root-class="mb-md"
    />

    <a-divider class="m-0 mb-md" orientation="left" plain>
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
      hide-title
      root-class="mb-md"
    />

    <a-form-item name="remark" :label="$t('common.remark')">
      <a-textarea v-model:value="entity.remark" :rows="4" show-count :maxlength="256" />
    </a-form-item>
  </crud-form-page>
</template>
