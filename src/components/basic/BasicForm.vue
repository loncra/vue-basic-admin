<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import LForm from "@/components/Form.vue";
import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import {
  type ComponentInternalInstance,
  getCurrentInstance,
  h,
  inject,
  nextTick,
  onActivated,
  onMounted,
  ref
} from "vue";
import {CONFIG_PROVIDER, SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";
import type {BasicAuthorityProps, BasicCrudService, BasicIdMetadata, RestResult} from "@/types";
import {requireNonNullOrUndefined} from "@/utils";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {App, Checkbox} from "antdv-next";
import {isResultSuccess} from "@/requests/http";
import type {RouteLocationRaw} from "vue-router";
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import {LAYOUT_CONTENT_CLOSE_TAB_KEY} from "@/constants/systemConstant";
import LOperationDataTraceTable from "@/components/auth-server/OperationDataTraceTable.vue";

const { message, modal } = App.useApp()

defineOptions({
  name: 'LBasicForm',
})

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const closeLayoutTab = inject<Function>(LAYOUT_CONTENT_CLOSE_TAB_KEY)

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const configProviderStore = useConfigProviderStore()
const menuPrincipalStore = useMenuPrincipalStore()
const rememberMe = ref(false)

const props = withDefaults(
  defineProps<{
    operationDataTraceTarget:string,
    service: BasicCrudService<TBody,TEntity>
    authority?: BasicAuthorityProps
    preMounted?: () => void | Promise<void>
    postMounted?: () => void | Promise<void>
    redirect: RouteLocationRaw
    titleText?: (title:string, entity: TEntity) => string
  }>(),
  {
    titleText: (title:string, entity: TEntity) => title,
  },
)

const formRef = ref()
const creationTime = ref<number>()
const spinning = defineModel<boolean>("spinning", {default: false})
const entity = defineModel<TBody>("entity", {default: () => {}})

const emit = defineEmits<{
  (e: 'success', data: RestResult<TId>): void
  (e: 'postGet', data: RestResult<TEntity>, entity:TBody): void
  (e: 'resetFields'): void
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
      emit('success', result)
      if (!entity.value.id) {
        createdAfterSetting(result)
      } else {
        message.success(result.message)
        globalProperties.$router.push(props.redirect)
        getEntity(entity.value.id)
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

function createdAfterSetting(result:RestResult<TId>) {
  if (!configProviderStore.state.createSuccessBack) {
    modal.confirm({
      title: globalProperties.$t('form.createSuccess.title'),
      content: result.message + ' ' + globalProperties.$t('form.createSuccess.subTitle'),
      okText: globalProperties.$t('form.createSuccess.okReturnList'),
      cancelText: globalProperties.$t('form.createSuccess.addAnother'),
      onOk: () => {
        globalProperties.$router.push(props.redirect)
        if (rememberMe.value) {
          configProviderStore.setCreateSuccessBack(CONFIG_PROVIDER.CREATE_SUCCESS_BACK.HOME)
        }
        closeLayoutTab?.(globalProperties.$route.fullPath, false);
      },
      onCancel: () => {
        formRef.value?.resetFields?.()
        emit('resetFields')
        if (rememberMe.value) {
          configProviderStore.setCreateSuccessBack(CONFIG_PROVIDER.CREATE_SUCCESS_BACK.CURRENT)
        }
      },
      footer: ({ extra }: any) => {
        return [
          h(Checkbox, {
            checked:rememberMe.value,
            'onUpdate:checked': (v: boolean) => rememberMe.value = v,
            class: 'mr',
          }, { default: () => '记住我的操作' }),
          h(extra.OkBtn),
          h(extra.CancelBtn)
        ]
      }
    })
    return ;
  }

  message.success(result.message)
  formRef.value?.resetFields?.()
  emit('resetFields')

  if (configProviderStore.state.createSuccessBack === CONFIG_PROVIDER.CREATE_SUCCESS_BACK.HOME) {
    globalProperties.$router.push(props.redirect)
  }

}

function onFinish () {
  formRef.value.validate().then(() => doSubmit())
}

async function getEntity(id: TId) {
  const result:RestResult<TEntity> = await props.service.get(id);
  const value = {...entity.value, ...result?.data || {}}
  for (const key in entity.value) {
    if (value[key] === undefined) {
      continue;
    }
    entity.value[key] = value[key]
  }
  emit('postGet', result, entity.value)

  const ct = (value as { creationTime?: number }).creationTime
  if (ct != null) {
    creationTime.value = ct
  }
}

async function mounted() {

  spinning.value = true
  if (props.preMounted) {
    await props.preMounted()
  }
  const id = globalProperties.$route.query[SYSTEM_CONSTANT.ID_NAME] as TId
  if (id) {
    await getEntity(id)
  }
  spinning.value = false
  await nextTick(doPostMounted)
}

async function doPostMounted() {
  updateTitle(entity.value as TEntity)
  if (props.postMounted) {
    await props.postMounted()
  }
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
  updateTitle(entity.value as TEntity)
  if (!entity.value.id) {
    return ;
  }
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

    <l-menu-title-card >
      <l-form id="form" ref="formRef" @finish="onFinish" :model="entity">
        <a-spin :spinning="spinning">
          <a-row :gutter="[configProviderStore.getToken().marginMD]">
            <slot name="rowLayout"></slot>
          </a-row>
          <slot></slot>
          <div v-if="entity.id && creationTime" class="mb-md">
            <a-divider orientation="left" plain>
              <a-space>
                <icon-font class="icon" type="icon-time-response" />
                <span>{{ globalProperties.$t('form.operationDataTrace') }}</span>
              </a-space>
            </a-divider>
            <l-operation-data-trace-table detailView :date="creationTime" :query="{'filter_[data.operationDataTrace.target_eq]': props.operationDataTraceTarget, 'filter_[data.operationDataTrace.entityId_eq]':entity.id}"/>
          </div>
          <a-space>
            <a-button type="primary" html-type="submit" :loading="spinning">
              <template #icon>
                <icon-font class="icon" type="icon-save" />
              </template>
              <span>{{ globalProperties.$t('common.save') }}</span>
            </a-button>

            <a-button html-type="reset" :disabled="spinning">
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
