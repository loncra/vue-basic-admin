<script setup lang="ts">
import LBasicDetail from "@/components/basic/BasicDetail.vue";
import {getEnumName, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, getCurrentInstance, ref, watch} from "vue";
import {RoleService} from "@/apis/auth-server/roleService.ts";
import type {RoleEntity} from "@/types/apis/auth-server/roleDomain";
import {AUTH_SERVER_ROLE_ROUTE, OPERATION_DATA_TRACE_TABLE} from '@/constants';
import LResourceTable from "@/components/auth-server/ResourceTable.vue";

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

const resourceQuery = ref<Record<string,unknown>>({'filter_[enabled_eq]':'1', 'filter_[sources_jin]':[]})

const resourceTableRef = ref()

function postGetEntity(entity:RoleEntity) {
  resourceQuery.value['filter_[sources_jin]'] = entity.sources.map(getEnumValue);
  return entity
}
// 表格已挂载 且 实体已加载 → 刷新，两种就绪顺序都能覆盖
watch(
  [resourceTableRef, () => entity.value.id],
  () => {
    if (resourceTableRef.value && entity.value.id) {
      resourceTableRef.value.fetchDataSource()
    }
  },
  {immediate: true},
)
</script>

<template>
  <div>
    <l-basic-detail
      :post-get-entity="postGetEntity"
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.ROLE"
      :redirect="{name:AUTH_SERVER_ROLE_ROUTE.HOME}"
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
      <template #afterDescriptions>
        <a-divider orientation="left" plain>
          <a-space>
            <icon-font class="icon" type="loncra-key-round" />
            {{ globalProperties.$t('authServer.standaloneResource') }}
          </a-space>
        </a-divider>

        <l-resource-table
          :immediate="false"
          ref="resourceTableRef"
          :drag="false"
          preview
          hide-title
          :query="resourceQuery"
          :row-selection="{fixed:true, type: 'checkbox', selectedRowKeys: entity.resourceIds, getCheckboxProps:() => ({disabled:true})}"
        />
      </template>
    </l-basic-detail>

  </div>
</template>
