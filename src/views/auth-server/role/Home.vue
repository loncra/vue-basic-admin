<script setup lang="ts">

import LRoleTable from "@/components/auth-server/RoleTable.vue";

import type {TableProps} from "antdv-next";

import {getEnumValue} from "@/utils";

import type {RoleEntity} from '@/types/apis/auth-server/roleDomain';

import type {ActionDefinition} from '@/types/composables';

defineOptions({
  name: 'AuthServerRoleHome'
})

const getCheckboxProps: NonNullable<TableProps['rowSelection']>['getCheckboxProps'] = (record) => ({
  disabled: getEnumValue(record.removable) === 0,
})

const rowSelection: NonNullable<TableProps['rowSelection']> = {
  fixed: true,
  type: 'checkbox',
  getCheckboxProps,
}

const rowActions: ActionDefinition<RoleEntity>[] = [
  {
    id: 'edit',
    visible: (ctx) => getEnumValue(ctx.record!.modifiable) !== 0,
  },
  {
    id: 'delete',
    visible: (ctx) => getEnumValue(ctx.record!.removable) !== 0,
  },
]

</script>

<template>

  <div>
    <l-role-table
      :row-actions="rowActions"
      ref="table"
      :row-selection="rowSelection"
    />
  </div>

</template>

