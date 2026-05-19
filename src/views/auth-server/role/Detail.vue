<script setup lang="ts">
import LBasicDetail from "@/components/basic/BasicDetail.vue";
import {getEnumName, requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import {RoleService} from "@/apis/auth-server/roleService.ts";
import type {RoleEntity} from "@/types/apis/auth-server/roleDomain";

defineOptions({
  name: 'AuthServerRoleHome'
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new RoleService()
const entity = ref<RoleEntity>({
  resourceIds: [],
  version: 0,
  enabled: 0,
  sources: [],
  removable: 0,
  modifiable: 0,
  name: "",
  authority: "",
  children: [],
  id: 0
})

</script>

<template>
  <div>
    <l-basic-detail
      operation-data-trace-target="tb_role"
      :redirect="{name:'auth_server_role'}"
      :title-text="(title:string, _entity:RoleEntity) => title + ' (' + _entity.name + ')'"
      :service="service"
      :column="{xxxl: 2,xxl: 2,xl: 2,lg: 2,md: 2,sm: 1,xs: 1}"
      v-model:entity="entity"
    >
      <a-descriptions-item :label="globalProperties.$t('common.id')">
        {{entity.id}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.name')">
        {{entity.name}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.authority')">
        {{entity.authority}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.role.modifiable')">
        {{getEnumName(entity.modifiable)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.role.removable')">
        {{getEnumName(entity.removable)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.source')">
        {{ entity.sources.map(getEnumName).join(',') }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.enabled')">
        {{ getEnumName(entity.enabled)}}
      </a-descriptions-item>

      <a-descriptions-item :label="globalProperties.$t('common.remark')">
        {{ entity.remark || '' }}
      </a-descriptions-item>
    </l-basic-detail>
  </div>
</template>
