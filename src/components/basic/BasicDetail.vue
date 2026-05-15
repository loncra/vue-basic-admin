<script setup lang="ts" generic="TEntity extends BasicIdMetadata<TId>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";
import type {BasicIdMetadata, DetailSearchService, RestResult} from "@/types";
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  inject,
  onActivated,
  onMounted,
  ref
} from "vue";
import {requireNonNullOrUndefined} from "@/utils";
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import {App} from "antdv-next";
import {LAYOUT_CONTENT_CLOSE_TAB_KEY} from "@/constants/systemConstant";
import type {RouteLocationRaw} from "vue-router";
import LOperationDataTraceTable from "@/components/auth-server/OperationDataTraceTable.vue";

const { modal } = App.useApp()

defineOptions({
  name: 'LBasicDetail',
})

const closeLayoutTab = inject<Function>(LAYOUT_CONTENT_CLOSE_TAB_KEY)

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const menuPrincipalStore = useMenuPrincipalStore()
const props = withDefaults(
  defineProps<{
    operationDataTraceTarget:string,
    redirect: RouteLocationRaw
    service: DetailSearchService<TEntity>
    titleText?: (title:string, entity: TEntity) => string
  }>(),
  {
    titleText: (title:string, entity: TEntity) => title,
  },
)

const loading = defineModel<boolean>("loading", {default: false})
const entity = defineModel<TEntity>("entity", {default: () => {}})
const creationTime = ref<number>()
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
  const ct = (value as { creationTime?: number }).creationTime
  if (ct != null) {
    creationTime.value = ct
  }
  entity.value = value
  updateTitle(value)
}


function updateTitle(entity: TEntity) {
  const title = props.titleText(globalProperties.$route.meta.title as string, entity as TEntity)
  const currentBreadcrumbs = [...menuPrincipalStore.state.currentBreadcrumbs];
  const last = currentBreadcrumbs.at(-1)
  if (last) {
    last.name = title;
  }
  menuPrincipalStore.setCurrentBreadcrumbs(currentBreadcrumbs);
}

async function activated() {
  if (!entity.value.id) {
    return ;
  }
  updateTitle(entity.value as TEntity)
  const result:RestResult<TEntity> = await props.service.get(entity.value.id);
  if (result.data) {
    return ;
  }

  modal.warning({
    title: globalProperties.$t('error.staleEntityForm.title'),
    content: globalProperties.$t('error.staleEntityForm.subTitle'),
    onOk: () => {
      closeLayoutTab?.(globalProperties.$route.fullPath, false);
      globalProperties.$router.push(props.redirect)

    }
  })
}

onActivated(activated)

onMounted(mounted)

</script>

<template>
  <div>
    <l-menu-title-card :loading="loading">
      <a-descriptions bordered v-bind="$attrs">
        <slot></slot>
      </a-descriptions>

      <div v-if="entity.id && creationTime" class="mb-md">
        <a-divider orientation="left" plain>
          <a-space>
            <icon-font class="icon" type="icon-time-response" />
            <span>{{ globalProperties.$t('form.operationDataTrace') }}</span>
          </a-space>
        </a-divider>
        <l-operation-data-trace-table detailView :date="creationTime" :query="{'filter_[data.operationDataTrace.target_eq]': props.operationDataTraceTarget, 'filter_[data.operationDataTrace.entityId_eq]':entity.id}"/>
      </div>
    </l-menu-title-card>
  </div>
</template>
