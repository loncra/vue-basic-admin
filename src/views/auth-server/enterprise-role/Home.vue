<script setup lang="ts">

import type {TableProps} from "antdv-next";

import {getEnumValue} from "@/utils";

import type {ActionDefinition} from '@/types/composables';
import {YES_OR_NO_TYPE} from "@/constants";
import LEnterpriseRoleTable from "@/components/auth-server/EnterpriseRoleTable.vue";
import type {EnterpriseRoleEntity} from "@/types/apis";

defineOptions({
  name: 'AuthServerEnterpriseRoleHome'
})

const getCheckboxProps: NonNullable<TableProps['rowSelection']>['getCheckboxProps'] = (record) => ({
  disabled: getEnumValue(record.removable) === YES_OR_NO_TYPE.NO,
})

const rowSelection: NonNullable<TableProps['rowSelection']> = {
  fixed: true,
  type: 'checkbox',
  getCheckboxProps,
}

const rowActions: ActionDefinition<EnterpriseRoleEntity>[] = [
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
    <l-enterprise-role-table
      :row-actions="rowActions"
      :row-selection="rowSelection"
    />
  </div>

</template>
