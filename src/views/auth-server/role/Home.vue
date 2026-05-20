<script setup lang="ts">
import LRoleTable from "@/components/auth-server/RoleTable.vue";
import type {MenuProps, TableProps} from "antdv-next";
import {getEnumValue} from "@/utils";
import type {RoleEntity} from '@/types/apis/auth-server/roleDomain';

defineOptions({
  name: 'AuthServerRoleHome'
})


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
    <l-role-table
      :render-action-items="renderActionItems"
      ref="table"
      :row-selection="{fixed: true,type: 'checkbox', getCheckboxProps: getCheckboxProps}"
    />
  </div>
</template>
