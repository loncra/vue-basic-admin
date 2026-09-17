<script setup lang="ts">
import {App} from 'antdv-next'
import type {TreeSortMetadata} from '@loncra/client/commons'
import {SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {ResourceEntity} from '@loncra/client/auth'
import {ResourceService} from '@loncra/client/auth'
import {CrudHomePage} from '@/components/basic/page'
import {resourcePage} from './resource.page'

/**
 * 资源列表页薄壳。
 * 列、搜索、行操作、权限、插件行不可选都在声明（resource.page.ts）里；
 * 这里只处理「树拖拽排序」这个需要调接口、声明管不到的提交动作。
 */
defineOptions({
  name: 'AuthServerResourceHome',
})

const {message} = App.useApp()
const service = new ResourceService()

async function onTreeDrop(
  sorts: TreeSortMetadata<ResourceEntity[typeof SYSTEM_CONSTANT.ID_NAME]>[],
) {
  const result = await service.sort(sorts)
  message.success(result.message)
}
</script>

<template>
  <crud-home-page
    :page="resourcePage"
    :pagination="false"
    :scroll="{x: 'max-content', y: 350}"
    :expand-icon-column-index="3"
    @tree-drop="onTreeDrop"
  />
</template>
