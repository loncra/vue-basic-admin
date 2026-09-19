<script setup lang="ts">

import type {TableProps} from "antdv-next";


import type {ActionDefinition} from '@loncra/antdv-pro';
import {YES_OR_NO_TYPE} from '@/constants';
import LEnterpriseRoleTable from "@/components/auth-server/EnterpriseRoleTable.vue";
import type {EnterpriseRoleEntity} from "@loncra/client/auth";
import {getEnumValue} from "@loncra/client/commons"

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
