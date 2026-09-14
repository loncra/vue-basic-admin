<script setup lang="ts">
import LResourceTable from "@/components/auth-server/ResourceTable.vue";
import {getEnumValue} from "@/utils";
import type {TableProps} from "antdv-next";
import {AUTH_SERVER_RESOURCE_CATEGORY} from '@loncra/client/auth';

defineOptions({
  name: 'AuthServerResourceHome'
})

const getCheckboxProps: NonNullable<TableProps["rowSelection"]>["getCheckboxProps"] = (record) => {
  return {
    disabled: getEnumValue(record.category) === AUTH_SERVER_RESOURCE_CATEGORY.PLUGIN,
  }
}

</script>

<template>
  <div>
    <l-resource-table
      :row-selection="{fixed: true, type: 'checkbox',getCheckboxProps: getCheckboxProps}"
    />
  </div>
</template>
