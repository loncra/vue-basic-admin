<script setup lang="ts" generic="TEntity extends BasicIdMetadata<TId>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import {LAYOUT_PANE_TITLE_KEY, SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";
import type {BasicIdMetadata, DetailSearchService, RestResult} from "@/types/apis";
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  inject,
  nextTick,
  onActivated,
  onMounted,
  ref,
  watch
} from "vue";
import {requireNonNullOrUndefined} from "@/utils";
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import {getRouteTitle} from "@/routers";
import {App, type MenuProps} from "antdv-next";
import {LAYOUT_CONTENT_CLOSE_TAB_KEY} from "@/constants/systemConstant";
import type {RouteLocationNormalizedLoaded, RouteLocationRaw} from "vue-router";
import LOperationDataTraceTable from "@/components/auth-server/OperationDataTraceTable.vue";
import i18n from "@/i18n";

const { modal } = App.useApp()

defineOptions({
  name: 'LBasicDetail',
})

const closeLayoutTab = inject<Function>(LAYOUT_CONTENT_CLOSE_TAB_KEY)
const setPaneName = inject<(fullPath: string, name: string) => void>(LAYOUT_PANE_TITLE_KEY)

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const menuPrincipalStore = useMenuPrincipalStore()
const props = withDefaults(
  defineProps<{
    queryFields?: string[],
    getDetail?: (id: TId) => Promise<RestResult<TEntity>>,
    actionItems?: NonNullable<MenuProps['items']>
    operationDataTraceTarget?:string,
    redirect: RouteLocationRaw
    service: DetailSearchService<TEntity>
    titleText?: (title:string, entity: TEntity) => string
  }>(),
  {
    queryFields: () => ['id'],
    titleText: (title:string, entity: TEntity) => title,
  },
)

const loading = defineModel<boolean>("loading", {default: false})
const entity = defineModel<TEntity>("entity", {default: () => {}})
const creationTime = ref<number>()
const route = ref<RouteLocationNormalizedLoaded>()

function fetchDetail(id: TId): Promise<RestResult<TEntity>> {
  return props.getDetail != null ? props.getDetail(id) : props.service.get(id)
}

async function mounted() {
  loading.value = true;
  const id = globalProperties.$route.query[SYSTEM_CONSTANT.ID_NAME] as TId

  const data:Record<string, string>[] = [];
  props.queryFields.forEach(field => {
    if (!globalProperties.$route.query[field]) {
      data.push({code:"400",field:field,defaultMessage: globalProperties.$t('error.notNull', {field: field})});
    }
  })

  if (data.length > 0) {
    sessionStorage.setItem(import.meta.env.VITE_APP_SESSION_STORAGE_BAD_REQUEST_NAME, JSON.stringify(data));
    globalProperties.$router.push({name:"400"});
    closeLayoutTab?.(globalProperties.$route.fullPath, false);
    return ;
  }
  const result:RestResult<TEntity> = await fetchDetail(id);
  const value = {...entity.value, ...result?.data || {}};
  const ct = (value as { creationTime?: number }).creationTime
  if (ct != null) {
    creationTime.value = ct
  }
  entity.value = value
  route.value = globalProperties.$route;
  await nextTick();
  updateTitle(value)
  loading.value = false;
}

function updateTitle(entity: TEntity, updateCurrentBreadcrumbs:boolean = true) {

  if(!route.value) {
    return ;
  }

  const title = props.titleText(getRouteTitle(route.value.name), entity as TEntity)
  setPaneName?.(route.value.fullPath as string,title)
  if (!updateCurrentBreadcrumbs) {
    return ;
  }
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

watch(
  () => i18n.global.locale.value,
  () => {
    if (entity.value) {
      updateTitle(entity.value)
    }
  },
)

</script>

<template>
  <div>
    <l-menu-title-card :loading="loading">
      <a-descriptions bordered v-bind="$attrs" :title="globalProperties.$t('common.basicInformation')">
        <template #extra>

        </template>
        <slot></slot>
      </a-descriptions>

      <slot name="afterDescriptions"></slot>

      <div v-if="entity.id && creationTime && operationDataTraceTarget">
        <a-divider orientation="left" plain>
          <a-space>
            <icon-font class="icon" type="icon-time-response" />
            <span>{{ globalProperties.$t('form.operationDataTrace') }}</span>
          </a-space>
        </a-divider>
        <l-operation-data-trace-table hide-title detailView :date="creationTime" :query="{'filter_[data.operationDataTrace.target_eq]': props.operationDataTraceTarget, 'filter_[data.operationDataTrace.entityId_eq]':entity.id}"/>
      </div>

      <slot name="afterOperationDataTrace"></slot>
    </l-menu-title-card>
  </div>
</template>
