<script setup lang="ts">
import LEnterpriseMemberTable from "@/components/auth-server/EnterpriseMemberTable.vue";
import {AUTH_SERVER_AUDIT_STATUS_VALUE} from '@loncra/client/auth'

defineOptions({
  name: 'AuthServerEnterpriseMemberHome'
})

</script>

<template>
  <div>
    <l-enterprise-member-table :query="{'filter_[audit_status_eq]':AUTH_SERVER_AUDIT_STATUS_VALUE.AGREED}"/>
  </div>
</template>
