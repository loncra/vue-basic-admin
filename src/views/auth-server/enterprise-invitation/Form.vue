<script setup lang="ts">
import {computed, h} from 'vue'
import {Space} from 'antdv-next'
import {FileAddOutlined} from '@antdv-next/icons'
import {CrudFormModal as LCrudFormModal} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import {
  enterpriseInvitationFormPage
} from '@/views/auth-server/enterprise-invitation/enterprise-invitation.form.page.ts'

/**
 * 发起邀请弹层（薄壳）：字段与必填、审核类型的来源、角色表、操作轨迹**全在声明里**
 * （`enterprise-invitation.form.page.ts`）—— 这里只剩三件事：开关、标题、成功后通知宿主。
 *
 * ⚠️ 旧版那个 `auditTypeOptions` prop **已删**：审核类型的 options 现在由**声明的 `enumRef`** 自己拉
 * （旧壳 `l-modal-form` 拉不到来源，才要宿主把列表的桶算好递进来）。
 * 同理 `v-model:entity` 也没了：实体归声明（`createEntity`），弹层每次打开重挂载 ⇒ 宿主不必复位。
 */
defineOptions({
  name: 'AuthServerEnterpriseInvitationForm',
})

const open = defineModel<boolean>('open', {default: false})
const emit = defineEmits<{success: []}>()

/**
 * 标题：纯新增（旧页那句 `common.add` + 页面名，文案**一字未动**）。
 * 图标同另外两个弹层（pro 默认 `add` 动作用的 `FileAddOutlined`，见
 * `packages/antdv-pro/src/_util/crud/defaultActions.ts`）。
 */
const title = computed(() =>
  h(Space, null, {
    default: () => [
      h(FileAddOutlined),
      i18n.global.t('common.add', {
        name: ' ' + i18n.global.t('authServer.enterpriseInvitation.routePage'),
      }),
    ],
  }),
)

/** 保存成功：旧页就是"关弹层 + 通知宿主"（刷新列表由宿主接 `@success` 做） */
function onSuccess(): void {
  open.value = false
  emit('success')
}
</script>

<template>
  <l-crud-form-modal
    v-model:open="open"
    :page="enterpriseInvitationFormPage"
    :title="title"
    @success="onSuccess"
  />
</template>
