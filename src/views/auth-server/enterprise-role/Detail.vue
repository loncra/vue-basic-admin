<script setup lang="ts">
import LBasicDetail from "@/components/basic/BasicDetail.vue";
import {getEnumName, requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from "vue";
import {EnterpriseRoleService} from "@/apis/auth-server/enterpriseRoleService.ts";
import {AUTH_SERVER_ENTERPRISE_ROLE_ROUTE, OPERATION_DATA_TRACE_TABLE} from '@/constants';
import type {EnterpriseRoleEntity, ResourceEntity, RestResult} from "@/types/apis";
import LResourceTable from "@/components/auth-server/ResourceTable.vue";
import {ResourceService} from "@/apis";

defineOptions({
  name: 'AuthServerEnterpriseRoleDetail'
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new EnterpriseRoleService()
const resourceService = new ResourceService()
const entity = ref<EnterpriseRoleEntity>({
  resourceIds: [],
  version: 0,
  enabled: 0,
  removable: 0,
  modifiable: 0,
  name: "",
  authority: "",
  children: [],
  id: 0
})

const resourceDataSource = ref<ResourceEntity[]>()

async function loadResourceDataSource() {
  const result:RestResult<ResourceEntity[]> = await resourceService.findEnterprise({})
  resourceDataSource.value = result.data || []
}

onMounted(() => loadResourceDataSource())

</script>

<template>
  <div>
    <l-basic-detail
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.ENTERPRISE_ROLE"
      :redirect="{name:AUTH_SERVER_ENTERPRISE_ROLE_ROUTE.HOME}"
      :title-text="(title:string, _entity:EnterpriseRoleEntity) => title + ' (' + _entity.name + ')'"
      :service="service"
      :column="{xxxl: 3,xxl: 3,xl: 3,lg: 2,md: 2,sm: 1,xs: 1}"
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
      <a-descriptions-item :label="globalProperties.$t('common.enabled')">
        {{ getEnumName(entity.enabled)}}
      </a-descriptions-item>

      <a-descriptions-item :label="globalProperties.$t('common.remark')" :span="2">
        {{ entity.remark || '' }}
      </a-descriptions-item>

      <template #afterDescriptions>
        <a-divider orientation="left" plain>
          <a-space>
            <icon-font class="icon" type="loncra-key-round" />
            {{ globalProperties.$t('authServer.standaloneResource') }}
          </a-space>
        </a-divider>

        <l-resource-table
          ref="resourceTableRef"
          :immediate="false"
          :drag="false"
          preview
          hide-title
          v-model:resource-ids="entity.resourceIds"
          v-model:data-source="resourceDataSource"
          :row-selection="{getCheckboxProps:() => ({disabled:true})}"
        />
      </template>
    </l-basic-detail>
  </div>
</template>
