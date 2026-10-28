<script setup lang="ts">
import {ref} from 'vue'
import type {EnterpriseMemberEntity} from '@loncra/client/auth'
import {CrudHomePage, type CrudHomePageExpose} from '@loncra/antdv-pro'
import LEnterpriseInvitationModal from '@/views/auth-server/enterprise-invitation/Form.vue'
import LEnterpriseMemberAuditModal from '@/views/auth-server/enterprise-invitation/Audit.vue'
import {
  enterpriseMemberAudit,
  enterpriseMemberHomePage,
  enterpriseMemberInvitation,
} from './enterprise-member.home.page'

defineOptions({
  name: 'AuthServerEnterpriseMemberHome',
})

const table = ref<CrudHomePageExpose<EnterpriseMemberEntity>>()
</script>

<template>
  <div>
    <crud-home-page ref="table" :page="enterpriseMemberHomePage" />

    <teleport v-if="enterpriseMemberInvitation.open || enterpriseMemberAudit.open" to="body">
      <l-enterprise-invitation-modal
        v-if="enterpriseMemberInvitation.open"
        v-model:open="enterpriseMemberInvitation.open"
        @success="table?.fetchDataSource()"
      />

      <l-enterprise-member-audit-modal
        v-if="enterpriseMemberAudit.open"
        @success="table?.fetchDataSource()"
      />
    </teleport>
  </div>
</template>
