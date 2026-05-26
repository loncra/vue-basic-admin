<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import type {
  EnumBucketsResponseBody,
  NameValueEnumMetadata,
  ResourceEntity,
  RestResult,
  RoleEntity,
  RoleSavePayload
} from "@/types/apis";
import {findAllTreeNodes, findFirstTreeNode, requireNonNullOrUndefined, unmergeTree} from "@/utils";
import LBasicForm from "@/components/basic/BasicForm.vue";
import {ResourceServerService} from "@/apis";
import LResourceTable from "@/components/auth-server/ResourceTable.vue";
import {RoleService} from "@/apis/auth-server/roleService.ts";
import type {FilterRequest} from "@/types/apis/common.js";
import {getEnumValue, isNameValueEnumMetadata} from "@/utils/commonUtils.ts";
import type {TableProps} from 'antdv-next'
import type {RowSelectMethod} from 'antdv-next/dist/table/interface'

defineOptions({
  name: 'AuthServerRoleForm'
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new RoleService()

const options = ref<{
  entity:RoleSavePayload
  modifiableOptions:NameValueEnumMetadata<number>[]
  enabledOptions:NameValueEnumMetadata<number>[]
  removableOptions:NameValueEnumMetadata<number>[]
  sourceOptions:NameValueEnumMetadata<string>[]
  spinning:boolean
  resourceDataSource:ResourceEntity[],
  resourceQuery:FilterRequest,
  parent?:RoleEntity
}>({
  spinning: false,
  entity: {
    id:null as unknown as number,
    version:null as unknown as number,
    enabled: 1,
    sources: [],
    resourceIds: [],
    removable: 1,
    modifiable: 1,
    parentId:null as unknown as number,
    name: "",
    authority: "",
    remark: ""
  },
  modifiableOptions:[],
  enabledOptions:[],
  removableOptions:[],
  sourceOptions:[],
  resourceQuery:{'filter_[enabled_eq]':'1', 'filter_[sources_jin]':[]},
  resourceDataSource:[]
})

const resourceTableRef = ref<InstanceType<typeof LResourceTable>>()

type SourceChangeOption = { value: string; name: string }

function toSourceSelectOptions(
  sources: NameValueEnumMetadata<string>[] | string[] | undefined,
): SourceChangeOption[] {
  if (!sources?.length) {
    return []
  }
  return sources.map((s) => ({
    value: String(getEnumValue(s)),
    name: isNameValueEnumMetadata(s)
      ? s.name
      : (options.value.sourceOptions.find((o) => String(getEnumValue(o)) === s)?.name ?? String(s)),
  }))
}

async function mounted() {

  const enums:RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({"resource-server":[{"id":"YesOrNo"}, {"id":"ResourceSourceEnum"}]})
  if (enums.data) {
    options.value.modifiableOptions = enums.data['resource-server']?.YesOrNo as NameValueEnumMetadata<number>[]
    options.value.enabledOptions = enums.data['resource-server']?.YesOrNo as NameValueEnumMetadata<number>[]
    options.value.removableOptions = enums.data['resource-server']?.YesOrNo as NameValueEnumMetadata<number>[]
    options.value.sourceOptions = enums.data['resource-server']?.ResourceSourceEnum as NameValueEnumMetadata<string>[]
  }
  if (globalProperties.$route.query.parentId) {
    const result:RestResult<RoleEntity> = await service.get(globalProperties.$route.query.parentId as unknown as number)
    if (result.data) {
      options.value.parent = result.data

      options.value.entity.parentId = options.value.parent?.id as number
      options.value.entity.sources = options.value.parent?.sources as string[]
      options.value.entity.resourceIds = options.value.parent?.resourceIds as number[]
      options.value.entity.removable = options.value.parent?.removable as number
      options.value.entity.modifiable = options.value.parent?.modifiable as number
      sourceChange('', toSourceSelectOptions(options.value.parent?.sources))
    }
  }
}

function sourceChange(_value: string, _options: SourceChangeOption[]) {
  if (_options.length <= 0) {
    resourceTableRef.value?.clearDataSource()
    return;
  }
  options.value.resourceQuery['filter_[sources_jin]'] = _options.map((o) => o.value);
  resourceTableRef.value?.fetchDataSource()
}

function setPageTitle(title:string, entity: RoleEntity | RoleSavePayload) {
  if (options.value.parent) {
    return title + ' (' + options.value.parent.name + ')'
  } else if (entity.id) {
    return title + ' (' + entity.name + ')'
  }
  return title
}

function postGetEntity(_entity: RoleEntity) {
  options.value.resourceQuery['filter_[sources_jin]'] = _entity.sources.map(getEnumValue);
  resourceTableRef.value?.fetchDataSource()
  return _entity;
}

function resetFields() {
  options.value.entity.resourceIds = []
}

const onResourceChange: NonNullable<TableProps['rowSelection']>['onChange'] = (
  _selectedRowKeys,
  _selectedRows,
  info: { type: RowSelectMethod }
) => {
  if (info.type === 'all') {
    options.value.entity.resourceIds = _selectedRowKeys as number[];
  }
}

const onResourceSelect: NonNullable<TableProps['rowSelection']>['onSelect'] = (
  _record,
  _selected,
  _selectedRows,
) => {
  const selectedRowIds = Array.from(new Set(_selectedRows.map(s => s.id)));
  const unmerge = unmergeTree([_record]);
  const unmergeIds = unmerge.map(u => u.id);

  if (_selected) {
    const parentIds = [
      ...new Set(
        unmerge
        .map(u => u.parentId)
        .filter((id): id is number => id != null && id !== _record.id)
      )
    ];

    options.value.entity.resourceIds = [
      ...findParentNode(parentIds).map(r => r.id),
      ..._selectedRows.map(r => r.id),
      ...unmerge.filter(d => !selectedRowIds.includes(d.id)).map(r => r.id)
    ];
  } else {
    const parentIds = [
      ...new Set(
        unmerge
        .map(u => u.parentId)
        .filter((id): id is number => id != null)
      )
    ];
    const parentNode = findParentNode(parentIds);
    for (const parent of parentNode) {
      const full:ResourceEntity | undefined = findFirstTreeNode(r => r.id === parent.id, options.value.resourceDataSource);
      if (full && full.children && !full.children.some(c => selectedRowIds.includes(c.id))) {
        selectedRowIds.splice(selectedRowIds.indexOf(parent.id), 1);
        unmergeIds.push(parent.id)
      }
    }

    options.value.entity.resourceIds = _selectedRows.filter(s => !unmergeIds.includes(s.id)).map(r => r.id);
  }
}

function findParentNode(parentIds:number[]):ResourceEntity[] {
  const parentNode = findAllTreeNodes(r => parentIds.includes(r.id), options.value.resourceDataSource);
  const ids = [
    ...new Set(
      parentNode
      .map(r => r.parentId)
      .filter((id): id is number => id != null)
    )
  ];
  if (ids.length > 0) {
    parentNode.push(...findParentNode(ids));
  }
  return parentNode;
}

</script>

<template>
  <div>
    <l-basic-form
      @resetFields="resetFields"
      operation-data-trace-target="tb_role"
      :post-get-entity="postGetEntity"
      :pre-mounted="mounted"
      :title-text="setPageTitle"
      :redirect="{name:'auth_server_role'}"
      :service="service"
      v-model:entity="options.entity"
      :spinning="options.spinning"
    >
      <template #rowLayout>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="name" :label="globalProperties.$t('common.name')" :rules="[{required: true}]">
            <a-input v-model:value="options.entity.name" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="authority" :label="globalProperties.$t('authServer.authority')" :rules="[{required: true}]">
            <a-input v-model:value="options.entity.authority" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="sources" :label="globalProperties.$t('authServer.source')" :rules="[{required: true, trigger: 'change', type: 'array'}]">
            <a-select mode="multiple" v-model:value="options.entity.sources" :options="options.sourceOptions" :field-names="{label:'name'}" @change="sourceChange" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="removable" :label="globalProperties.$t('authServer.role.removable')">
            <a-select v-model:value="options.entity.removable" :options="options.removableOptions" :field-names="{label:'name'}" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="modifiable" :label="globalProperties.$t('authServer.role.modifiable')">
            <a-select v-model:value="options.entity.modifiable" :options="options.modifiableOptions" :field-names="{label:'name'}" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="enabled" :label="globalProperties.$t('common.enabled')">
            <a-select v-model:value="options.entity.enabled" :options="options.enabledOptions" :field-names="{label:'name'}" />
          </a-form-item>
        </a-col>
      </template>

      <a-divider class="m-0 mb-md" orientation="left" plain>
        <a-space>
          <icon-font class="icon" type="icon-template-success" />
          {{ globalProperties.$t('authServer.standaloneResource') }}
        </a-space>
      </a-divider>

      <l-resource-table
        ref="resourceTableRef"
        :immediate="false"
        :drag="false"
        preview
        hide-title
        v-model:data-source="options.resourceDataSource"
        root-class="mb-md"
        :query="options.resourceQuery"
        :row-selection="{type: 'checkbox', selectedRowKeys: options.entity.resourceIds, onSelect:onResourceSelect, onChange:onResourceChange}"
      />

      <a-form-item name="remark" :label="globalProperties.$t('common.remark')">
        <a-textarea v-model:value="options.entity.remark" :rows="4" show-count :maxlength="256" />
      </a-form-item>
    </l-basic-form>
  </div>
</template>
