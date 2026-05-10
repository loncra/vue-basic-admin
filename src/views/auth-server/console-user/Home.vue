<script setup lang="ts">
import LMenuTitleCard from '@/components/basic/MenuTitleCard.vue'
import LConsoleUserTableTable from "@/components/auth-server/ConsoleUserTable.vue";
import LAuthorityButton from "@/components/basic/AuthorityButton.vue";

defineOptions({
  name: 'LAuthServerConsoleUserHome',
})

</script>

<template>
  <div>
    <l-menu-title-card>
      <template #extra>
        <l-authority-button :authority="{save:'perms[auth_server_console_user:save]', delete:'perms[auth_server_console_user:delete]', export:'perms[auth_server_console_user:export]'}" />
      </template>
      <l-console-user-table-table />
    </l-menu-title-card>
  </div>
</template>
