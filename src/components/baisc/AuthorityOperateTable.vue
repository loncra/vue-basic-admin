<script setup lang="ts" generic="TEntity extends BasicIdMetadata<any>">
import type {BasicCrudService, BasicIdMetadata} from '@/types'
import {onMounted} from "vue";

defineOptions({
  name: 'LAuthorityOperateTable',
})

const props = withDefaults(defineProps<{
  service: BasicCrudService<TEntity>
  mountedLoad?: boolean
}>(),{
  mountedLoad:true
})

function mounted() {
  if (props.mountedLoad) {

    //props.service.fetchAll()
  }
}

onMounted(mounted)
</script>

<template>
  <a-table v-bind="$attrs"></a-table>
</template>
