<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import LForm from "@/components/Form.vue";
import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import {type ComponentInternalInstance, getCurrentInstance, onActivated, onMounted, ref} from "vue";
import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";
import type {BasicAuthorityProps, BasicCrudService, BasicIdMetadata, RestResult} from "@/types";
import {requireNonNullOrUndefined} from "@/utils";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {message} from "antdv-next";
import {isResultSuccess} from "@/requests/http";
import type {RouteLocationRaw} from "vue-router";
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";

defineOptions({
  name: 'LBasicForm',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const configProviderStore = useConfigProviderStore()
const menuPrincipalStore = useMenuPrincipalStore()

const props = withDefaults(
  defineProps<{
    service: BasicCrudService<TBody,TEntity>
    authority?: BasicAuthorityProps
    redirect?: RouteLocationRaw
    titleText?: (title:string, entity: TEntity) => string
  }>(),
  {
    titleText: (title:string, entity: TEntity) => title,
  },
)

const formRef = ref()
const spinning = defineModel<boolean>("spinning", {default: false})
const entity = defineModel<TBody>("entity", {default: () => {}})

const emit = defineEmits<{
  (e: 'success', data: RestResult<TId>): void
  (e: 'postGet', data: RestResult<TEntity>, entity:TBody): void
}>()

async function doSubmit() {
  spinning.value = true
  try {
    const result = await props.service.save(entity.value)
    if(!isResultSuccess(result)) {
      message.warning(result.message)
      return ;
    }
    if(result.status === 200) {
      message.success(result.message)
      if (props.redirect) {
        globalProperties.$router.push(props.redirect)
      } else {
        emit('success', result)
      }
    } else {
      message.error(result.message)
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : String(error))
  } finally {
    spinning.value = false
  }
}

function onFinish () {
  formRef.value.validate().then(() => doSubmit())
}

async function mounted() {
  const id = globalProperties.$route.query[SYSTEM_CONSTANT.ID_NAME] as TId
  if (id) {
    const result:RestResult<TEntity> = await props.service.get(id);
    const value = {...entity.value, ...result?.data || {}}
    for (const key in entity.value) {
      if (value[key] === undefined) {
        continue;
      }
      entity.value[key] = value[key]
    }
    emit('postGet', result, entity.value)
    updateTitle(entity.value as TEntity)
  }
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
    <l-menu-title-card >
      <l-form id="form" ref="formRef" @finish="onFinish" :model="entity">
        <a-spin :spinning="spinning">
          <a-row :gutter="[configProviderStore.getToken().marginMD]">
            <slot name="rowLayout"></slot>
          </a-row>
          <slot></slot>
          <a-space>
            <a-button type="primary" html-type="submit" :loading="spinning">
              <template #icon>
                <icon-font class="icon" type="icon-save" />
              </template>
              <span>{{ globalProperties.$t('common.save') }}</span>
            </a-button>

            <a-button html-type="reset">
              <template #icon>
                <icon-font class="icon" type="icon-time-history" />
              </template>
              <span>{{ globalProperties.$t('common.reset') }}</span>
            </a-button>
          </a-space>
        </a-spin>
      </l-form>
    </l-menu-title-card>
  </div>
</template>
