<script setup lang="ts">
import LMenuTitleCard from '@/components/basic/MenuTitleCard.vue'
import LConsoleUserTable from "@/components/auth-server/ConsoleUserTable.vue";
import LAuthorityButton from "@/components/basic/AuthorityButton.vue";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import {requireNonNullOrUndefined} from "@/utils";

defineOptions({
  name: 'LAuthServerConsoleUserHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const table = ref();

</script>

<template>
  <div>
    <l-menu-title-card>
      <template #extra>
        <l-authority-button
          :authority="{
            add:'perms[auth_server_console_user:save]',
            delete:'perms[auth_server_console_user:delete]',
            export:'perms[auth_server_console_user:export]'
          }"
          @delete="table.removeSelected()"
          @add="globalProperties.$router.push({name:'auth_server_console_user_edit'})"
        />
      </template>
      <l-console-user-table ref="table" />
    </l-menu-title-card>
  </div>
</template>
