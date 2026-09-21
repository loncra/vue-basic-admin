<script setup lang="ts">
import {onActivated, ref, watch} from 'vue'
import {App} from 'antdv-next'
import {CrudHomePage as LCrudHomePage, type CrudHomePageExpose} from '@loncra/antdv-pro'
import type {DataDictionaryEntity} from '@loncra/client/resource'
import type {FilterRequest, RestResult, TreeSortMetadata} from '@loncra/client/commons'
import router from '@/routers'
import {RESOURCE_SERVER_DATA_DICTIONARY_ROUTE, SYSTEM_CONSTANT} from '@/constants'
import {dataDictionaryService} from './data-dictionary.page'
import {dataDictionaryHomePage} from './data-dictionary.home.page'

/**
 * 字典数据列表（字典页右半边，被 `dictionary/Home.vue` 嵌入）。
 *
 * - **数据依赖左树选中的类型**：`typeId` 由外层传进来，变了就换查询条件并刷新；没有就不加载。
 * - 这一侧**有路由**（ADD / EDIT / DETAIL ⇒ `Form.vue` / `Detail.vue`），新增还要带上当前类型。
 */
defineOptions({
  name: 'ResourceServerDataDictionaryHome',
})

const props = defineProps<{
  /** 左树（字典类型）选中的 id；没有就不加载 */
  typeId?: number | string
}>()

const {message} = App.useApp()
const table = ref<CrudHomePageExpose<DataDictionaryEntity>>()
const query = ref<FilterRequest>({})

/** 换类型 = 换查询条件 + 刷一次 */
function reload(): void {
  if (!props.typeId) {
    return
  }
  query.value['filter_[type_id_eq]'] = props.typeId
  void table.value?.fetchDataSource()
}

watch(() => props.typeId, () => reload())

/** 切回本页也刷一次：从新增/编辑页返回时 `typeId` 没变，但数据可能已经变了（首次挂载交给 watch） */
let activated = false
onActivated(() => {
  if (!activated) {
    activated = true
    return
  }
  reload()
})

/** 新增要带上当前类型（pro 的默认跳转只拼主键）⇒ 本页接管 `@add` */
function onAdd(): void {
  if (!props.typeId) {
    return
  }
  void router.push({
    name: RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.ADD,
    query: {typeId: String(props.typeId)},
  })
}

/** 拖拽排序：`sort` 是 service 的实例方法 ⇒ 用核心导出的同一个实例 */
async function onDrop(
  sorts: TreeSortMetadata<DataDictionaryEntity[typeof SYSTEM_CONSTANT.ID_NAME]>[],
): Promise<void> {
  const result: RestResult<void> = await dataDictionaryService.sort(sorts)
  void message.success(result.message)
}
</script>

<template>
  <l-crud-home-page
    ref="table"
    v-model:query="query"
    :page="dataDictionaryHomePage"
    :immediate="false"
    :bordered="false"
    :expand-icon-column-index="3"
    @drop="onDrop"
    @add="onAdd"
  >
    <template #title>
      <a-flex justify="space-between" align="center">
        <a-space>
          <icon-font icon="icon align" type="loncra-database" />
          <a-typography-text strong>
            {{ $t('resourceServer.dataDictionary.routePage') }}
          </a-typography-text>
        </a-space>
      </a-flex>
    </template>
  </l-crud-home-page>
</template>
