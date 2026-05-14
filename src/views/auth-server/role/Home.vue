<script setup lang="ts">
import LMenuTitleCard from '@/components/basic/MenuTitleCard.vue'
import LRoleTable from "@/components/auth-server/RoleTable.vue";
import LAuthorityButton from "@/components/basic/AuthorityButton.vue";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import type {MenuProps, TableProps} from "antdv-next";
import {getEnumValue, requireNonNullOrUndefined} from "@/utils";
import type {RoleEntity} from '@/types/auth-server/roleType';

defineOptions({
  name: 'LAuthServerRoleHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const table = ref();
const selectedRows = ref<RoleEntity[]>([]);

const onRowSelectionChange: NonNullable<TableProps["rowSelection"]>["onChange"] = (
  _keys,
  rows,
) => {
  selectedRows.value = rows as RoleEntity[]
}

const getCheckboxProps: NonNullable<TableProps["rowSelection"]>["getCheckboxProps"] = (record) => {
  return {
    disabled: getEnumValue(record.removable) === 0,
  }
}

const renderActionItems = (
  record: RoleEntity,
  actionItems: NonNullable<MenuProps['items']>
) => {
  const filterItems:string[] = [];
  if (getEnumValue(record.modifiable) === 0) {
    filterItems.push('edit');
  }
  if (getEnumValue(record.removable) === 0) {
    filterItems.push('delete');
  }
  return actionItems.filter((item) => !filterItems.includes(item?.key as string))
}

</script>

<template>
  <div>
    <l-menu-title-card>
      <template #extra>
        <l-authority-button
          :authority="{
            add:'perms[auth_server_role:save]',
            delete:'perms[auth_server_role:delete]',
            export:'perms[auth_server_role:export]'
          }"
          @delete="table.removeSelected(selectedRows)"
          @add="globalProperties.$router.push({name:'auth_server_role_add'})"
        />
      </template>
      <l-role-table
        :render-action-items="renderActionItems"
        ref="table"
        :row-selection="{type: 'checkbox', onChange: onRowSelectionChange, getCheckboxProps: getCheckboxProps}"
      />
    </l-menu-title-card>
  </div>
</template>
