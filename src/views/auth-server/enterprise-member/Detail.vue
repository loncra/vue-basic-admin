<script setup lang="ts">
import {computed, inject, ref} from 'vue'
import {
  AuthServerService,
  type EnterpriseMemberEntity,
  type EnterpriseRoleEntity,
  type ResourceEntity
} from '@loncra/client/auth'
import {AUTH_SERVER_ENTERPRISE_MEMBER_ROLE} from '@loncra/client/auth'
import {getEnumValue} from '@loncra/client/commons'
import {CrudDetailPage, CrudHomePage} from '@loncra/antdv-pro'
import type {TableProps} from 'antdv-next'
import useApp from 'antdv-next/dist/app/useApp'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {
  APP_RELOAD_PROVIDE_KEY,
  AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY,
} from '@/constants'
import {usePrincipalStore} from '@/stores/principalStore'
import {enterpriseRoleHomePage} from '@/views/auth-server/enterprise-role/enterprise-role.home.page'
import {resourceHomePage} from '@/views/auth-server/resource/resource.home.page'
import {
  fetchEnterpriseResources,
  RESOURCE_VARIANT,
  resourceTreeSelection,
} from '@/views/auth-server/resource/resource.page'
import {enterpriseMemberCore, enterpriseMemberService} from './enterprise-member.page'
import {enterpriseMemberDetailPage} from './enterprise-member.detail.page'

/**
 * 企业成员详情页薄壳：字段 / 枚举显示 / 跨列数 / 操作记录都在声明里；
 * 这里留四件宿主的事 —— 主键（pro 不认路由）、标题、离场，外加「角色 / 独立资源」
 * 两张**勾选回写**的表与保存按钮（都要读写实体的 `roleIds` / `resourceIds`）。
 */
defineOptions({
  name: 'AuthServerEnterpriseMemberDetail',
})

const detailRef = ref<{entity?: EnterpriseMemberEntity}>()

/** 详情必须有 id：缺了就摆清错误字段跳 400，且**壳不挂载**；**id 由它一并带出来**（快照） */
const {ok, id} = useRequiredQuery()

/** 当前实体：两张附表要读写它的 `roleIds` / `resourceIds` */
const entity = computed(() => detailRef.value?.entity)

const reload = inject<() => void>(APP_RELOAD_PROVIDE_KEY)
const principalStore = usePrincipalStore()
const {message} = useApp()

/** 旧 `title-text` 是 `标题 (昵称 / 账号 / 手机)` */
function displayName(): string | undefined {
  const record = entity.value
  return record ? AuthServerService.getPrincipalNameByUserDetails(record) : undefined
}
useEntityPageTitle(displayName)

/** 记录被删 ⇒ 回列表 + 关 tab（旧 `BasicDetail` 自己干的） */
const {onStale} = usePageExit({redirect: enterpriseMemberCore.routes?.home})

/** 资源选择器的实例：树形勾选要按它当前的 `dataSource` 找祖先 / 子节点 */
const resourcePickerRef = ref<{dataSource?: ResourceEntity[]}>()

/** 勾选角色：角色 id 直接回写，并把角色自带的资源 id 并进 `resourceIds`（旧页同一段） */
const roleSelectedChange: NonNullable<TableProps['rowSelection']>['onChange'] = (
  _selectedRowKeys,
  selectedRows,
) => {
  const current = entity.value
  if (!current) {
    return
  }
  const rows = selectedRows as EnterpriseRoleEntity[]
  current.roleIds = rows.flatMap((r) => (r.id != null ? [r.id] : []))
  current.resourceIds = [
    ...new Set([
      ...(current.resourceIds ?? []),
      ...rows.flatMap((r) => r.resourceIds ?? []),
    ]),
  ]
}

const loading = ref(false)

async function onSave(): Promise<void> {
  const current = entity.value
  if (!current) {
    return
  }
  loading.value = true
  try {
    const result = await enterpriseMemberService.save(current)
    message.success(result.message)
    reload?.()
  } finally {
    loading.value = false
  }
}

function canSave(): boolean {
  return principalStore.hasPermission(AUTH_SERVER_ENTERPRISE_MEMBER_AUTHORITY.SAVE)
}
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="enterpriseMemberDetailPage"
    @stale="onStale"
  >
    <!-- 旧 `BasicDetail` 的同名插槽：描述列表之后、操作记录之前 -->
    <template #afterDescriptions="{entity: member}">
      <a-divider titlePlacement="start" plain>
        <a-space>
          <icon-font class="icon" type="loncra-users-round" />
          {{ $t('authServer.userRole') }}
        </a-space>
      </a-divider>

      <!-- 角色表：pro 的角色列表声明当**选择器**用（不要行内动作；标题由上面的分割线给） -->
      <crud-home-page
        class="mb-md"
        :page="enterpriseRoleHomePage"
        :record-actions="false"
        :title="false"
        plain
        :query="{'filter_[enabled_eq]':'1'}"
        :row-selection="{
          type: 'checkbox',
          selectedRowKeys: member.roleIds,
          onChange: roleSelectedChange,
          getCheckboxProps: () => ({disabled: getEnumValue(member.role) === AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER}),
        }"
      />

      <a-divider titlePlacement="start" plain>
        <a-space>
          <icon-font class="icon" type="loncra-key-round" />
          {{ $t('authServer.standaloneResource') }}
        </a-space>
      </a-divider>

      <!-- 独立资源：pro 的资源列表声明当**只读勾选器**用；取数口换成 `/resource/find/enterprise` -->
      <crud-home-page
        ref="resourcePickerRef"
        :page="resourceHomePage"
        :variant="RESOURCE_VARIANT.PICKER"
        :record-actions="false"
        :drag="false"
        plain
        :pagination="false"
        :title="false"
        :scroll="{x: 'max-content', y: 350}"
        :expand-icon-column-index="2"
        :fetch="fetchEnterpriseResources"
        :row-selection="resourceTreeSelection({
          dataSource: () => resourcePickerRef?.dataSource ?? [],
          selectedIds: () => member.resourceIds,
          onChange: (ids) => { member.resourceIds = ids },
          getCheckboxProps: () => ({
            disabled:
              getEnumValue(member.role) === AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER ||
              !canSave(),
          }),
        })"
      />
    </template>
    <!-- 旧 `#afterOperationDataTrace`：保存按钮（无 SAVE 权限不出） -->
    <template #afterOperationDataTrace v-if="canSave()">
      <div class="mb-md" />
      <a-button type="primary" @click="onSave" :loading="loading">
        <icon-font class="icon" type="loncra-save" v-if="!loading" />
        {{ $t('common.save') }}
      </a-button>
    </template>
  </crud-detail-page>
</template>
