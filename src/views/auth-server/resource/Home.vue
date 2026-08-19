<script setup lang="ts">
import LResourceTable from "@/components/auth-server/ResourceTable.vue";
import {getEnumValue} from "@/utils";
import type {TableProps} from "antdv-next";
import {RESOURCE_CATEGORY} from "@/constants";

defineOptions({
  name: 'AuthServerResourceHome'
})

const getCheckboxProps: NonNullable<TableProps["rowSelection"]>["getCheckboxProps"] = (record) => {
  return {
    disabled: getEnumValue(record.category) === RESOURCE_CATEGORY.PLUGIN,
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
