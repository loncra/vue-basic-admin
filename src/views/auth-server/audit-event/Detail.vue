<script setup lang="ts">
import {ref} from 'vue'
import {useRoute} from 'vue-router'
import {useI18n} from 'vue-i18n'
import type {AuditEventEntity} from '@loncra/client/auth'
// ⚠️ 必须显式 import：宿主 `src/components` 下的旧 kit 渲染器被 unplugin-vue-components
// 自动注册成了**全局** `CrudDetailPage` ⇒ 漏 import 不报错、静默跑旧 kit（2026-09-28 踩过）
import {CrudDetailPage} from '@loncra/antdv-pro'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {AUTH_SERVER_AUDIT_EVENT_ROUTE} from '@/constants'
import {auditEventDetailPage} from './audit-event.detail.page'

/**
 * 审计事件详情页薄壳（「认证事件」与「操作数据轨迹」两个列表共用）：字段、显示优先级、跨列数、
 * 取数（带 `after`）都在声明（`audit-event.detail.page.ts` / `audit-event.page.ts`）。
 *
 * 这里只剩：主键、离场，外加「请求信息」那几块（按数据显隐 + 遍历对象画 `a-descriptions`）。
 */
defineOptions({
  name: 'AuthServerAuditEventDetail',
})

const {t} = useI18n()
const route = useRoute()
const detailRef = ref<{entity?: AuditEventEntity}>()

/**
 * 详情必须有 id（缺了就跳 400、壳不挂载）；`after` 是取数要带的查询参数（旧 `:query-fields`）。
 * ⚠️ 用 `numeric: false`：这两个值是**字符串**（`AuditEventService.detail(id: string, after: string)`），
 * 账户 id 那套"转成 number"的口径在这里不适用。
 */
const {ok, id, after} = useRequiredQuery(['id', 'after'], {numeric: false})

/** 离场回列表：两条路由进来（认证事件 / 操作数据轨迹），按当前路由名判断回哪 */
const {onStale} = usePageExit({
  redirect:
    route.name === AUTH_SERVER_AUDIT_EVENT_ROUTE.AUTHENTICATION_DETAIL
      ? AUTH_SERVER_AUDIT_EVENT_ROUTE.AUTHENTICATION
      : AUTH_SERVER_AUDIT_EVENT_ROUTE.OPERATION_DATA_TRACE,
})

interface DetailSection {
  show: boolean
  icon: string
  plain: boolean
  title: string
  source: Record<string, unknown> | undefined
}

/**
 * 「请求信息」各块：形状全是"有数据才画：分割线（图标 + 标题）+ 遍历对象画 `a-descriptions`"，
 * 区别只在图标 / 标题 / 分割线要不要 `plain` ⇒ 一处描述、模板里 `v-for`
 * （旧页面是五段几乎重复的 markup）。
 *
 * 用**函数**而不是 `computed`：它吃的是插槽给的 `entity`（渲染期求值 ⇒ 天然跟数据走）。
 */
function sectionsOf(entity: AuditEventEntity): DetailSection[] {
  const data = entity.data as
    | {
        details?: Record<string, unknown>
        metadata?: {
          headers?: Record<string, unknown>
          parameters?: Record<string, unknown>
          body?: Record<string, unknown>
        }
        operationTrace?: Record<string, unknown>
      }
    | undefined
  return [
    {
      show: !!data?.details,
      icon: 'loncra-user-round',
      plain: true,
      title: `${t('Crud.operationTrace.principal')} ${t('common.basicInformation')}`,
      source: data?.details,
    },
    {
      show: !!data?.metadata?.headers,
      icon: 'loncra-file-code',
      plain: false,
      title: `${t('common.request.header')} ${t('common.basicInformation')}`,
      source: data?.metadata?.headers,
    },
    {
      show: !!data?.metadata?.parameters,
      icon: 'loncra-file-code-corner',
      plain: false,
      title: `${t('common.request.parameter')} ${t('common.basicInformation')}`,
      source: data?.metadata?.parameters,
    },
    {
      show: !!data?.metadata?.body,
      icon: 'loncra-file-code-corner',
      plain: true,
      title: `${t('common.request.body')} ${t('common.basicInformation')}`,
      source: data?.metadata?.body,
    },
    {
      show: !!data?.operationTrace,
      icon: 'loncra-file-search',
      plain: true,
      title: t('Crud.operationTrace.data'),
      source: data?.operationTrace,
    },
  ]
}
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="auditEventDetailPage"
    :context-extra="{after}"
    @stale="onStale"
  >
    <!-- 旧 `BasicDetail` 的同名插槽：描述列表之后、操作记录之前 -->
    <template #afterDescriptions="{entity}">
      <template v-for="section of sectionsOf(entity)" :key="section.title">
        <template v-if="section.show">
          <a-divider title-placement="start" :plain="section.plain">
            <a-space>
              <icon-font class="icon align" :type="section.icon" />
              <span>{{ section.title }}</span>
            </a-space>
          </a-divider>
          <a-descriptions
            bordered
            :column="{xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1}"
            class="margin-top-lg"
          >
            <a-descriptions-item v-for="(value, key) in section.source" :key="key" :label="key">
              {{ value }}
            </a-descriptions-item>
          </a-descriptions>
        </template>
      </template>
    </template>
  </crud-detail-page>
</template>
