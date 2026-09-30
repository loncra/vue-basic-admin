<script setup lang="ts">
import {App} from 'antdv-next'
import {AUDIT_STATUS_VALUE, getEnumName} from '@loncra/client/commons'
import {Form as LForm, UserAvatar as LUserAvatar} from '@loncra/antdv-pro'
import {AuthServerService} from '@/apis'
import {
  closeAudit,
  enterpriseMemberAudit,
  submitAudit,
} from '@/views/auth-server/enterprise-member/enterprise-member.home.page.ts'

/**
 * 企业成员**审核弹层**（旧 `EnterpriseMemberTable.vue` 里内联的那一段）。
 *
 * 数据与状态在声明里（`enterpriseMemberAudit` + `submitAudit`/`closeAudit`）——
 * 审核动作在声明（工具栏 / 行内），它要打开的是这里的弹层，所以状态从声明导出、壳只负责渲染。
 * 整页成员管理页与邀请页的展开行**两边都用它**（所以单独一个组件，不在壳里各抄一份）。
 */
defineOptions({
  name: 'AuthServerEnterpriseInvitationAuditForm',
})

const emit = defineEmits<{success: []}>()
const {message} = App.useApp()

/** 同意 / 拒绝：提交成功就提示 + 关弹层 + 让壳刷新列表（旧表 `onAudit`） */
async function onAudit(status: number): Promise<void> {
  const resultMessage = await submitAudit(status)
  if (resultMessage == null) {
    return
  }
  message.success(resultMessage)
  closeAudit()
  emit('success')
}
</script>

<template>
  <a-modal
    :open="enterpriseMemberAudit.open"
    :footer="null"
    :title="$t('common.audit.title')"
    @cancel="closeAudit"
  >
    <a-flex vertical gap="middle">
      <a-flex
        v-for="item of enterpriseMemberAudit.selectedItems"
        :key="item.id"
        align="center"
        gap="small"
        class="p-sm rounded-lg border border-border-secondary"
      >
        <l-user-avatar size="large" :user="item" />
        <a-flex vertical>
          <a-typography-text>
            {{ AuthServerService.getPrincipalNameByUserDetails(item) }}
          </a-typography-text>
          <a-typography-text>
            {{ getEnumName(item.role) }}
            {{ (item.roles || []).length > 0 ? ',' + (item.roles || []).map((r) => r.name).join(',') : '' }}
          </a-typography-text>
        </a-flex>
      </a-flex>

      <l-form id="auditForm" :model="enterpriseMemberAudit">
        <a-form-item :label="$t('common.remark')" name="remark">
          <a-textarea
            v-model:value="enterpriseMemberAudit.remark"
            :auto-size="{minRows: 5, maxRows: 10}"
          />
        </a-form-item>
        <a-flex align="center" justify="flex-end" gap="middle">
          <a-button
            type="primary"
            :loading="enterpriseMemberAudit.loading"
            @click="onAudit(AUDIT_STATUS_VALUE.AGREED)"
          >
            <template #icon>
              <icon-font type="loncra-clipboard-check" />
            </template>
            {{ $t('common.audit.agree') }}
          </a-button>
          <a-button
            type="primary"
            danger
            :loading="enterpriseMemberAudit.loading"
            @click="onAudit(AUDIT_STATUS_VALUE.DISAGREE)"
          >
            <template #icon>
              <icon-font type="loncra-clipboard-x" />
            </template>
            {{ $t('common.audit.reject') }}
          </a-button>
        </a-flex>
      </l-form>
    </a-flex>
  </a-modal>
</template>
