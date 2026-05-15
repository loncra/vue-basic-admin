<script setup lang="ts">
import LMenuTitleCard from '@/components/basic/MenuTitleCard.vue'
import LConsoleUserTable from "@/components/auth-server/ConsoleUserTable.vue";
import LAuthorityButton from "@/components/basic/AuthorityButton.vue";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import type {TableProps} from "antdv-next";
import {requireNonNullOrUndefined} from "@/utils";
import type {ConsoleUserEntity} from '@/types/auth-server/consoleUserType';

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const table = ref();
const selectedRows = ref<ConsoleUserEntity[]>([]);

const onRowSelectionChange: NonNullable<TableProps["rowSelection"]>["onChange"] = (
  _keys,
  rows,
) => {
  selectedRows.value = rows as ConsoleUserEntity[]
}
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
          @delete="table.removeSelected(selectedRows)"
          @add="globalProperties.$router.push({name:'auth_server_console_user_add'})"
        />
      </template>
      <l-console-user-table ref="table" :row-selection="{type: 'checkbox', onChange: onRowSelectionChange}" />
    </l-menu-title-card>
  </div>
</template>
