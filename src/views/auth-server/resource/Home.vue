<script setup lang="ts">
import LResourceTable from "@/components/auth-server/ResourceTable.vue";
import {ref} from "vue";
import {getEnumValue} from "@/utils";
import type {TableProps} from "antdv-next";

defineOptions({
  name: 'AuthServerResourceHome'
})

const table = ref();

const getCheckboxProps: NonNullable<TableProps["rowSelection"]>["getCheckboxProps"] = (record) => {
  return {
    disabled: getEnumValue(record.category) === 10,
  }
}

</script>

<template>
  <div>
    <l-resource-table
      ref="table"
      :row-selection="{type: 'checkbox',getCheckboxProps: getCheckboxProps}"
    />
  </div>
</template>
