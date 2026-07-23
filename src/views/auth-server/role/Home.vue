<script setup lang="ts">

import LRoleTable from "@/components/auth-server/RoleTable.vue";

import type {TableProps} from "antdv-next";

import {getEnumValue} from "@/utils";

import type {RoleEntity} from '@/types/apis/auth-server/roleDomain';

import type {ActionDefinition} from '@/types/composables';
import {YES_OR_NO_TYPE} from "@/constants";

defineOptions({
  name: 'AuthServerRoleHome'
})

const getCheckboxProps: NonNullable<TableProps['rowSelection']>['getCheckboxProps'] = (record) => ({
  disabled: getEnumValue(record.removable) === YES_OR_NO_TYPE.NO,
})

const rowSelection: NonNullable<TableProps['rowSelection']> = {
  fixed: true,
  type: 'checkbox',
  getCheckboxProps,
}

const rowActions: ActionDefinition<RoleEntity>[] = [
  {
    id: 'edit',
    visible: (ctx) => getEnumValue(ctx.record!.modifiable) !== YES_OR_NO_TYPE.NO,
  },
  {
    id: 'delete',
    visible: (ctx) => getEnumValue(ctx.record!.removable) !== YES_OR_NO_TYPE.NO,
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

