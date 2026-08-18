<script setup lang="ts">
import LResourceTable from "@/components/auth-server/ResourceTable.vue";
import {getEnumValue} from "@/utils";
import type {TableProps} from "antdv-next";

defineOptions({
  name: 'AuthServerResourceHome'
})

const getCheckboxProps: NonNullable<TableProps["rowSelection"]>["getCheckboxProps"] = (record) => {
  return {
    disabled: getEnumValue(record.category) === 10,
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
