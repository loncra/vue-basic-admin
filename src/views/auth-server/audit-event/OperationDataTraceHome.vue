<script setup lang="ts">
import {computed} from 'vue'
import dayjs from 'dayjs'
import type {AuditEventEntity} from '@loncra/client/auth'
import {CrudHomePage, createOperationTracePage} from '@loncra/antdv-pro'
import router from '@/routers'
import {postTimestampFormat} from '@/utils'
import {AUTH_SERVER_AUDIT_EVENT_ROUTE} from '@/constants'

/**
 * 整页审计（操作记录）列表。
 *
 * 7 个列、列 key、查询名（含那条复合查询名）与"嵌入态隐藏三列"都在 pro 的
 * `createOperationTracePage()` 里（从旧 `OperationDataTraceTable.vue` 逐条抄过去的），
 * 所以这个壳只剩三件**宿主**的事：
 * - 默认查询"今天 0 点之后"（旧表中没给 `date` 时的行为）—— ⚠️ **从 `afterDefault` 选项进声明**，
 *   不再走壳的 `:query`（与认证事件列表同一个口径：默认值属于**列**，见
 *   `authentication.home.page.ts` 的 `search.defaultValue`）；
 * - 行内「详情」动作 + 它的路由（旧表 `@detail`：带 `id` 与 `after`）；
 * - 审计详情的权限串（旧表 `:authority`）。
 *
 * `record-actions` 能从壳覆盖声明（`CrudHomePage` 的 `{...tableAttrs}` 排在显式 props 之后）。
 */
defineOptions({
  name: 'AuthServerOperationDataTraceHome',
})

/**
 * 声明在 setup 里实例化：服务类**构造期**就取 `BASE_URL` 建 client，模块级 `new` 会早于 `LClientProvider`。
 * `afterDefault` = 旧表行为"没给 `date` 就取当天 0 点之后"（`after` 不能为空，后端会报错）。
 * ⚠️ 给**要发出去的值**（`postTimestampFormat` 的结果，与详情跳转、认证事件列表同一格式），
 * 不是 Dayjs 对象 —— 这个值会被原样塞进查询。
 */
const page = computed(() =>
  createOperationTracePage({afterDefault: postTimestampFormat(dayjs().startOf('d'))}),
)

function openDetail(record: AuditEventEntity): void {
  void router.push({
    name: AUTH_SERVER_AUDIT_EVENT_ROUTE.OPERATION_DATA_TRACE_DETAIL,
    query: {id: String(record.id), after: record.timestamp},
  })
}
</script>

<template>
  <div>
    <crud-home-page
      :page="page"
      :record-actions="[{id: 'detail'}]"
      :authority="{detail: 'perms[auth_server_audit_event:get]'}"
      @detail="openDetail"
    />
  </div>
</template>
