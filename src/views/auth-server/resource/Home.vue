<script setup lang="ts">
import LMenuTitleCard from '@/components/basic/MenuTitleCard.vue'
import LResourceTable from "@/components/auth-server/ResourceTable.vue";
import LAuthorityButton from "@/components/basic/AuthorityButton.vue";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import {getEnumValue, requireNonNullOrUndefined} from "@/utils";
import type {ResourceEntity} from '@/types/auth-server/resourceType';
import type {TableProps} from "antdv-next";

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const table = ref();

const selectedRows = ref<ResourceEntity[]>([]);

const onRowSelectionChange: NonNullable<TableProps["rowSelection"]>["onChange"] = (
  _keys,
  rows,
) => {
  selectedRows.value = rows as ResourceEntity[]
}

const getCheckboxProps: NonNullable<TableProps["rowSelection"]>["getCheckboxProps"] = (record) => {
  return {
    disabled: getEnumValue(record.category) === 10,
  }
}

</script>

<template>
  <div>
    <l-menu-title-card>
      <template #extra>
        <l-authority-button
          :authority="{
            add:'perms[auth_server_authority_resource:save]',
            delete:'perms[auth_server_authority_resource:delete]',
            export:'perms[auth_server_authority_resource:export]'
          }"
          @delete="table.removeSelected(selectedRows)"
          @add="globalProperties.$router.push({name:'auth_server_resource_add'})"
        />
      </template>
      <l-resource-table
        ref="table"
        :row-selection="{type: 'checkbox', onChange: onRowSelectionChange, getCheckboxProps: getCheckboxProps}"
      />
    </l-menu-title-card>
  </div>
</template>
