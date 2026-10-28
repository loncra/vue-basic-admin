<script setup lang="ts">
import {ref} from 'vue'
import type {EnterpriseInvitationEntity} from '@loncra/client/auth'
import {AuthServerService} from '@loncra/client/auth'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {enterpriseInvitationCore} from './enterprise-invitation.page'
import {enterpriseInvitationDetailPage} from './enterprise-invitation.detail.page'

defineOptions({
  name: 'AuthServerEnterpriseInvitationDetail',
})

const detailRef = ref<{entity?: EnterpriseInvitationEntity}>()

const {ok, id} = useRequiredQuery()

useEntityPageTitle(() => {
  const entity = detailRef.value?.entity
  if (!entity) {
    return undefined
  }
  return entity.member
    ? AuthServerService.getPrincipalNameByUserDetails(entity.member)
    : entity.principal
})

const {onStale} = usePageExit({redirect: enterpriseInvitationCore.routes?.home})
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="enterpriseInvitationDetailPage"
    @stale="onStale"
  />
</template>
