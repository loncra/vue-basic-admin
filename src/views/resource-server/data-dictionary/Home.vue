<script setup lang="ts">
import {onActivated, ref, watch} from 'vue'
import {App} from 'antdv-next'
import {CrudHomePage, type CrudHomePageExpose} from '@loncra/antdv-pro'
import type {DataDictionaryEntity} from '@loncra/client/resource'
import type {FilterRequest, RestResult, TreeSortMetadata} from '@loncra/client/commons'
import {SYSTEM_CONSTANT} from '@loncra/client/commons'
import router from '@/routers'
import {RESOURCE_SERVER_DATA_DICTIONARY_ROUTE} from '@/constants'
import {dataDictionaryService} from './data-dictionary.page'
import {dataDictionaryHomePage} from './data-dictionary.home.page'

defineOptions({
  name: 'ResourceServerDataDictionaryHome',
})

const props = defineProps<{
  typeId?: number | string
}>()

const {message} = App.useApp()
const table = ref<CrudHomePageExpose<DataDictionaryEntity>>()
const query = ref<FilterRequest>({})

const cardClasses = {card: {root: 'rounded-none! border-0!', header: 'mb-0!', body: 'p-0!'}}

function reload(): void {
  if (!props.typeId) {
    return
  }
  query.value['filter_[type_id_eq]'] = props.typeId
  void table.value?.fetchDataSource()
}

watch(() => props.typeId, () => reload())

let activated = false
onActivated(() => {
  if (!activated) {
    activated = true
    return
  }
  reload()
})

function onAdd(): void {
  if (!props.typeId) {
    return
  }
  void router.push({
    name: RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.ADD,
    query: {typeId: String(props.typeId)},
  })
}

async function onDrop(
  sorts: TreeSortMetadata<DataDictionaryEntity[typeof SYSTEM_CONSTANT.ID_NAME]>[],
): Promise<void> {
  const result: RestResult<void> = await dataDictionaryService.sort(sorts)
  void message.success(result.message)
}
</script>

<template>
  <crud-home-page
    ref="table"
    v-model:query="query"
    :page="dataDictionaryHomePage"
    :classes="cardClasses"
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
  </crud-home-page>
</template>
