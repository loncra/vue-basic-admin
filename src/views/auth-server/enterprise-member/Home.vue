<script setup lang="ts">
import LEnterpriseMemberTable from "@/components/auth-server/EnterpriseMemberTable.vue";
import {AUDIT_STATUS_TYPE} from "@/constants";

defineOptions({
  name: 'AuthServerEnterpriseMemberHome'
})

</script>

<template>
  <div>
    <l-enterprise-member-table :query="{'filter_[audit_status_eq]':AUDIT_STATUS_TYPE.AGREED}"/>
  </div>
</template>
