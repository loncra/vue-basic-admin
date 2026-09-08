<script setup lang="ts">
import LEnterpriseMemberTable from "@/components/auth-server/EnterpriseMemberTable.vue";
import {AUTH_SERVER_ENTERPRISE_MEMBER_INVITATION} from "@/constants";

defineOptions({
  name: 'AuthServerEnterpriseMemberHome'
})

</script>

<template>
  <div>
    <l-enterprise-member-table :query="{'filter_[invitation_eq]':AUTH_SERVER_ENTERPRISE_MEMBER_INVITATION.ACTIVE}"/>
  </div>
</template>
