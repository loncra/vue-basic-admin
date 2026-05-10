<script setup lang="ts">
import LMenuTitleCard from '@/components/basic/MenuTitleCard.vue'
import LConsoleUserTableTable from "@/components/auth-server/ConsoleUserTable.vue";

defineOptions({
  name: 'LAuthServerConsoleUserHome',
})

</script>

<template>
  <div>
    <l-menu-title-card>
      <l-console-user-table-table />
    </l-menu-title-card>
  </div>
</template>
