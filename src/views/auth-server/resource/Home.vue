<script setup lang="ts">
import {App} from 'antdv-next'
import type {TreeSortMetadata} from '@loncra/client/commons'
import {SYSTEM_CONSTANT} from '@loncra/client/commons'
import type {ResourceEntity} from '@loncra/client/auth'
import {ResourceService} from '@loncra/client/auth'
import {CrudHomePage} from '@loncra/antdv-pro'
import {resourceHomePage} from './resource.home.page'

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
    :page="resourceHomePage"
    :pagination="false"
    :expand-icon-column-index="3"
    @tree-drop="onTreeDrop"
  />
</template>
