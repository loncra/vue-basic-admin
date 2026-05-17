<script setup lang="ts">
import LAuthorityOperateTable, {
  type SearchableColumnType
} from '@/components/basic/AuthorityOperateTable.vue'
import {type ComponentInternalInstance, getCurrentInstance, markRaw, onMounted, ref, watch} from 'vue'
import {App, type MenuItemType, type TableProps} from 'antdv-next';
import {Input, Select} from 'antdv-next'
import {ResourceServerService, ResourceService} from "@/apis";
import type {NameValueEnumMetadata, ResourceEntity, RestResult, TreeSortMetadata} from "@/types";
import type {EnumBucketsResponseBody} from "@/types/resource-server/resourceDomain.js";
import {createIcon, getEnumName, requireNonNullOrUndefined} from "@/utils";
import {
  buildTreePlacementMap,
  diffTreePlacementIds,
  type TreePlacement,
} from '@/utils/treeUtils'
import type {ResourceSavePayload} from '@/types/auth-server/resourceType'
import type {FilterRequest} from '@/types/common';
import {usePrincipalStore} from "@/stores/principalStore.ts";

defineOptions({
  name: 'LResourceTable',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const principalStore = usePrincipalStore()

const props = withDefaults(defineProps<{
  preview?: boolean,
  drag?:boolean,
  query?:FilterRequest,
  rowSelection?:TableProps["rowSelection"],
}>(), {
  preview: false,
  drag:true,
  rowSelection:() => ({type: 'checkbox'})
})
const { message } = App.useApp()

const service = new ResourceService()
const resourceServerService = new ResourceServerService()

const columns = ref<SearchableColumnType[]>([
  {
    title: globalProperties.$t('common.name'),
    dataIndex: 'name',
    key: 'name',
    width: 450,
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'like'
    },
  },
  {
    title: globalProperties.$t('authServer.authority'),
    dataIndex: 'authority',
    key: 'authority',
    ellipsis:true,
    width: 250,
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'like'
    },
  },
  {
    title: globalProperties.$t('authServer.resource.applicationName'),
    dataIndex: 'applicationName',
    key: 'application_name',
    width: 150,
    ellipsis:true,
    search: {
      component: markRaw(Select),
      props: {placeholder: globalProperties.$t('search.placeholder.select'), fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression: 'eq',
    },
  },
  {
    title: globalProperties.$t('authServer.source'),
    dataIndex: 'sources',
    width: 300,
    ellipsis:true,
    key: 'sources',
    search:{
      component: markRaw(Select),
      props:{mode:"multiple", placeholder: globalProperties.$t('search.placeholder.select'),fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression:'jin'
    },
  },
  {
    title: globalProperties.$t('authServer.resource.page'),
    dataIndex: 'page',
    width: 350,
    ellipsis:true,
    key: 'page',
    search:{
      component: markRaw(Input),
      props:{placeholder: globalProperties.$t('search.placeholder.input')},
      expression:'like'
    },
  },
  {
    title: globalProperties.$t('common.type'),
    dataIndex: 'type',
    key: 'type',
    ellipsis:true,
    width: 150,
    search:{
      component: markRaw(Select),
      props: {mode:'multiple',placeholder: globalProperties.$t('search.placeholder.select'), fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression: 'in',
    },
  },
  {
    title: globalProperties.$t('common.category'),
    dataIndex: 'category',
    key: 'category',
    ellipsis:true,
    width: 150,
    search:{
      component: markRaw(Select),
      props: {placeholder: globalProperties.$t('search.placeholder.select'), fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
      expression: 'eq',
    },
  },
])

const dataSource = ref<ResourceEntity[]>([])
const authorityOperateTable = ref()
/** 上一次确认的树位置（用于拖拽后 diff，仅在 fetch 结束与每次 drop 后更新） */
const lastTreePlacement = ref<Map<number, TreePlacement>>(new Map())

const actionItems = ref<MenuItemType[]>([])

function removeSelected(selectedRows: ResourceEntity[]) {
  authorityOperateTable.value.remove(selectedRows);
}

async function mounted() {
  if (!props.preview) {
    columns.value.splice(2, 0, {
      title: globalProperties.$t('authServer.source'),
      dataIndex: 'sources',
      width: 300,
      ellipsis:true,
      key: 'sources',
      search:{
        component: markRaw(Select),
        props:{mode:"multiple", placeholder: globalProperties.$t('search.placeholder.select'),fieldNames:{label:'name'}, classes:{root:'w-full'}, popupMatchSelectWidth:false},
        expression:'jin'
      },
    });
  }
  const enums:RestResult<EnumBucketsResponseBody> = await resourceServerService.getServiceEnumerates({"resource-server":[{"id":"ResourceSourceEnum"}],"auth-server":[{"id":"ResourceTypeEnum"},{"id":'ResourceCategoryEnum'}]})
  if (enums.data) {
    const typeCol = columns.value[columns.value.findIndex(s => s.dataIndex === "type")];
    if (typeCol?.search) {
      typeCol.search.props = typeCol.search.props ?? {}
      typeCol.search.props.options = enums.data['auth-server']?.ResourceTypeEnum
    }

    const categoryCol = columns.value[columns.value.findIndex(s => s.dataIndex === "category")];
    if (categoryCol?.search) {
      categoryCol.search.props = categoryCol.search.props ?? {}
      categoryCol.search.props.options = enums.data['auth-server']?.ResourceCategoryEnum
    }

    const statusCol = columns.value.find((s) => s.dataIndex === 'sources')
    if (statusCol?.search) {
      statusCol.search.props = statusCol.search.props ?? {}
      statusCol.search.props.options = enums.data['resource-server']?.ResourceSourceEnum
    }
  }
  if (principalStore.hasPermission('perms[resource_server_data_dictionary:save]')) {
    actionItems.value.push(
      {
        key: 'addChild',
        label: globalProperties.$t('common.addChild', {name:''}),
        icon: () => createIcon('icon-editor-add-cell'),
      }
    )
  }
}

function getSourcesName(sources: NameValueEnumMetadata<number>[]): string {
  return sources.map(s => getEnumName(s)).join(",")
}

function clearDataSource() {
  dataSource.value = []
}

async function fetchDataSource() {
  await authorityOperateTable.value.fetchDataSource()
  syncTreePlacementBaseline(dataSource.value)
}

function onActionItemClick(key: string, record: ResourceEntity) {
  if (key === 'addChild') {
    globalProperties.$router.push({name:'auth_server_resource_addChild', query:{parentId:String(record.id)}})
  }
}

function syncTreePlacementBaseline(tree: ResourceEntity[]) {
  lastTreePlacement.value = buildTreePlacementMap(tree)
}

/**
 * 按新树位置构造 ResourceService.save 可用的请求体（不含 children / key）
 */
function buildResourceSavePayloads(
  tree: ResourceEntity[],
  placement: Map<number, TreePlacement>,
  onlyIds?: number[],
): ResourceSavePayload[] {
  const idFilter = onlyIds ? new Set(onlyIds) : null
  const payloads: ResourceSavePayload[] = []

  function walk(nodes: ResourceEntity[]) {
    for (const node of nodes) {
      const place = placement.get(node.id)
      if (place && (!idFilter || idFilter.has(node.id))) {
        const {children, key, ...rest} = node
        payloads.push({
          ...rest,
          parentId: place.parentId,
          sort: place.sort,
        })
      }
      if (node.children?.length) {
        walk(node.children)
      }
    }
  }

  walk(tree)
  return payloads
}

async function onTreeDrop(
  drag: ResourceEntity,
  target: ResourceEntity,
  payload: { dropPosition: -1 | 0 | 1; tree: ResourceEntity[] },
) {
  const placementBefore = new Map(lastTreePlacement.value)
  const placementAfter = buildTreePlacementMap(payload.tree)
  const changedIds = diffTreePlacementIds(placementBefore, placementAfter)
  const savePayloads = buildResourceSavePayloads(payload.tree, placementAfter, changedIds)

  const treeSorts:TreeSortMetadata<number>[] = savePayloads.map(r => ({id:r.id, parentId:r.parentId, sort:r.sort}))
  const result:RestResult = await service.sort(treeSorts)
  message.success(result.message)
  lastTreePlacement.value = placementAfter
}

watch(
  dataSource,
  (tree) => {
    if (tree.length > 0 && lastTreePlacement.value.size === 0) {
      syncTreePlacementBaseline(tree)
    }
  },
  {deep: true},
)

defineExpose({
  removeSelected,
  clearDataSource,
  fetchDataSource
})

onMounted(mounted)
</script>

<template>
  <div>
    <l-authority-operate-table
      v-bind="$attrs"
      :drag="drag"
      @tree-drop="onTreeDrop"
      ref="authorityOperateTable"
      :query="query"
      v-model:data-source="dataSource"
      :expand-icon-column-index="3"
      :service="service"
      :columns="columns"
      :action-items="actionItems"
      :enabled-actions="!props.preview"
      :authority="{edit:'perms[auth_server_authority_resource:save]',detail:'perms[auth_server_authority_resource:get]', delete:'perms[auth_server_authority_resource:delete]'}"
      :scroll="{x:'max-content', y: 350}"
      :row-selection="rowSelection"
      @actionItemClick="onActionItemClick"
      @detail="r => globalProperties.$router.push({name:'auth_server_resource_detail', query:{id:String(r.id)}})"
      @edit="r => globalProperties.$router.push({name:'auth_server_resource_edit', query:{id:String(r.id)}})"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'name'">
          <a-space>
            <icon-font class="icon align" :type="record.icon || 'icon-survey'" />
            {{ record.name}}
          </a-space>
        </template>
        <template v-if="column.dataIndex === 'sources'">
          {{ getSourcesName(record.sources) }}
        </template>

        <template v-if="column.dataIndex === 'type'">
          {{ record.type.name }}
        </template>

        <template v-if="column.dataIndex === 'category'">
          {{ record.category.name }}
        </template>
      </template>
    </l-authority-operate-table>
  </div>
</template>
