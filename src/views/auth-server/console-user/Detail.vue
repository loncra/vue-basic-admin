<script setup lang="ts">
import {computed, ref} from 'vue'
import {useRoute} from 'vue-router'
import type {ConsoleUserSavePayload} from '@loncra/client/auth'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {SYSTEM_CONSTANT} from '@/constants'
import {consoleUserCore} from './console-user.page'
import {consoleUserDetailPage} from './console-user.detail.page'
import {resourceHomePage} from "@/views/auth-server/resource/resource.home.page.ts";
import {RESOURCE_VARIANT} from "@/views/auth-server/resource/resource.page.ts";
import {roleHomePage} from "@/views/auth-server/role/role.home.page.ts";
import {ROLE_VARIANT} from "@/views/auth-server/role/role.page.ts";

/** 控制台用户详情薄壳：字段、标签、格式化、跨列数都在声明里；标题用实体名拼（旧 `titleText`） */
defineOptions({
  name: 'AuthServerConsoleUserDetail',
})

const route = useRoute()
const detailRef = ref<{entity?: ConsoleUserSavePayload}>()
/** pro 的壳不认路由：主键由页壳取出来传进去 */
const id = computed(() => route.query[SYSTEM_CONSTANT.ID_NAME] as number | undefined)

const roleQuery = ref<Record<string, unknown>>({
  'filter_[enabled_eq]': '1',
  'filter_[sources_jin]': [],
})

/** 详情必须有 id：缺了就摆清错误字段跳 400，且**壳不挂载**（旧 `BasicDetail` 的 `queryFields`） */
const {ok} = useRequiredQuery()

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
        :page="roleHomePage"
        :variant="ROLE_VARIANT.PICKER"
        :record-actions="false"
        :drag="false"
        :pagination="false"
        plain
        :scroll="{x: 'max-content', y: 350}"
        :title="false"
        :query="roleQuery"
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
        :page="resourceHomePage"
        :variant="RESOURCE_VARIANT.PICKER"
        :record-actions="false"
        :drag="false"
        :pagination="false"
        :scroll="{x: 'max-content', y: 350}"
        :expand-icon-column-index="2"
        :title="false"
        plain
        :query="roleQuery"
        :row-selection="{
          fixed: true,
          type: 'checkbox',
          selectedRowKeys: entity.roleIds,
          getCheckboxProps: () => ({disabled: true}),
        }"
      />
    </template>
  </crud-detail-page>
</template>
