<script setup lang="ts">
import LMenuTitleCard from '@/components/basic/MenuTitleCard.vue'
import LResourceTable from "@/components/auth-server/ResourceTable.vue";
import LAuthorityButton from "@/components/basic/AuthorityButton.vue";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import {requireNonNullOrUndefined} from "@/utils";

defineOptions({
  name: 'LAuthServerResourceHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const table = ref();

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
          @delete="table.removeSelected()"
          @add="globalProperties.$router.push({name:'auth_server_authority_resource_add'})"
        />
      </template>
      <l-resource-table ref="table" />
    </l-menu-title-card>
  </div>
</template>
