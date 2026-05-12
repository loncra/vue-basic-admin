<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";
import type {BasicCrudService, BasicIdMetadata, RestResult} from "@/types";
import {type ComponentInternalInstance, getCurrentInstance, onActivated, onMounted} from "vue";
import {requireNonNullOrUndefined} from "@/utils";
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";

defineOptions({
  name: 'LBasicDetail',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const menuPrincipalStore = useMenuPrincipalStore()
const props = withDefaults(
  defineProps<{
    service: BasicCrudService<TBody,TEntity>
    titleText?: (title:string, entity: TEntity) => string
  }>(),
  {
    titleText: (title:string, entity: TEntity) => title,
  },
)


const loading = defineModel<boolean>("loading", {default: false})
const entity = defineModel<TEntity>("entity", {default: () => {}})

async function mounted() {
  const id = globalProperties.$route.query[SYSTEM_CONSTANT.ID_NAME] as TId
  const data = [];
  if (!globalProperties.$route.query.id) {
    data.push({code:"400",field:'id',defaultMessage:'id 不能为空'});
  }

  if (data.length > 0) {
    sessionStorage.setItem(import.meta.env.VITE_APP_SESSION_STORAGE_BAD_REQUEST_NAME, JSON.stringify(data));
    globalProperties.$router.push({name:"400"});
    return ;
  }
  const result:RestResult<TEntity> = await props.service.get(id);
  const value = {...entity.value, ...result?.data || {}};
  entity.value = value
  updateTitle(value)
}


function updateTitle(entity: TEntity) {
  if (!entity.id) {
    return ;
  }
  const title = props.titleText(globalProperties.$route.meta.title as string, entity as TEntity)
  const currentBreadcrumbs = [...menuPrincipalStore.state.currentBreadcrumbs];
  const last = currentBreadcrumbs.at(-1)
  if (last) {
    last.name = title;
  }
  menuPrincipalStore.setCurrentBreadcrumbs(currentBreadcrumbs);
}

onActivated(() => updateTitle(entity.value as TEntity))

onMounted(mounted)

</script>

<template>
  <div>
    <l-menu-title-card :loading="loading">
      <a-descriptions bordered v-bind="$attrs">
        <slot></slot>
      </a-descriptions>
    </l-menu-title-card>
  </div>
</template>
