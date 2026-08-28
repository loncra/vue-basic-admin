<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import LForm from "@/components/Form.vue";
import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  h,
  inject,
  nextTick,
  onActivated,
  onMounted,
  ref,
  watch
} from "vue";
import {
  CREATE_SUCCESS_BACK,
  LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY,
  LAYOUT_PANE_TITLE_PROVIDE_KEY,
  SYSTEM_CONSTANT
} from "@/constants";
import type {BasicCrudService, BasicIdMetadata, RestResult} from "@/types/apis";
import {requireNonNullOrUndefined} from "@/utils";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {App, Checkbox} from "antdv-next";
import {isResultSuccess} from "@/requests/http.ts";
import type {RouteLocationNormalizedLoaded, RouteLocationRaw} from "vue-router";
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import {getRouteTitle} from "@/routers";
import LOperationDataTraceTable from "@/components/auth-server/OperationDataTraceTable.vue";
import i18n from "@/i18n";

defineOptions({
  name: 'LBasicForm',
})

const closeLayoutTab = inject<(page: string, activatePane:boolean) => void>(LAYOUT_CONTENT_CLOSE_TAB_PROVIDE_KEY)
const setPaneName = inject<(fullPath: string, name: string) => void>(LAYOUT_PANE_TITLE_PROVIDE_KEY)

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const configProviderStore = useConfigProviderStore()
const menuPrincipalStore = useMenuPrincipalStore()
const rememberMe = ref(false)

const { message, modal } = App.useApp()

const props = withDefaults(
  defineProps<{
    operationDataTraceTarget:string,
    service: BasicCrudService<TBody,TEntity>
    preMounted?: () => void | Promise<void>
    postMounted?: () => void | Promise<void>
    preSubmit?: () => void | Promise<void>
    postSubmit?:(result:RestResult<TId>, postValue:TBody) => boolean | Promise<boolean>
    saveButton?: {
      show?:boolean
      icon?:string
      text:string
    }
    resetButton?: {
      show?:boolean
      icon?:string
      text:string
    }
    postGetEntity?:(entity: TEntity) => TEntity | Promise<TEntity>
    redirect: RouteLocationRaw
    titleText?: (title:string, entity: TEntity | TBody) => string
  }>(),
  {
    postGetEntity: (entity: TEntity) => entity,
    titleText: (title:string, entity: TEntity | TBody) => title,
  },
)

const formRef = ref()
const creationTime = ref<number>()
const spinning = defineModel<boolean>("spinning", {default: false})
const entity = defineModel<TBody>("entity", {default: () => {}})
const currentRoute = ref<RouteLocationNormalizedLoaded>()

const emit = defineEmits<{
  (e: 'success', data: RestResult<TId>): void
  (e: 'resetFields'): void
}>()

const resolvedSaveButton = computed(() => ({
  show: true,
  icon: 'loncra-save',
  text: i18n.global.t('common.save'),
  ...props.saveButton,      // 调用方覆盖则整体覆盖
}))

const resolvedResetButton = computed(() => ({
  show: true,
  icon: 'loncra-history',
  text: i18n.global.t('common.reset'),
  ...props.resetButton,
}))

async function doSubmit() {
  spinning.value = true
  try {
    if (props.preSubmit) {
      await props.preSubmit()
    }
    const result = await props.service.save(entity.value)
    if(!isResultSuccess(result)) {
      message.warning(result.message)
      return
    }
    let postSubmitResult = false
    if (props.postSubmit) {
      postSubmitResult = await props.postSubmit(result, entity.value)
    }
    if (postSubmitResult) {
      emit('success', result)
      return
    }
    if(result.status === 200) {
      emit('success', result)
      if (!entity.value.id) {
        createdAfterSetting(result)
      } else {
        message.success(result.message)
        entity.value = await getEntity(entity.value.id)
        updateTitle(entity.value as TEntity)
        globalProperties.$router.push(props.redirect)
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
          configProviderStore.setCreateSuccessBack(CREATE_SUCCESS_BACK.HOME)
        }
        closeLayoutTab?.(globalProperties.$route.fullPath, false);
      },
      onCancel: () => {
        formRef.value?.resetFields?.()
        emit('resetFields')
        if (rememberMe.value) {
          configProviderStore.setCreateSuccessBack(CREATE_SUCCESS_BACK.CURRENT)
        }
      },
      footer: ({ extra }) => {
        return [
          h(Checkbox, {
            checked:rememberMe.value,
            'onUpdate:checked': (v: boolean) => rememberMe.value = v,
            class: 'mr',
          }, { default: () => globalProperties.$t("common.rememberOperate") }),
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

  if (configProviderStore.state.createSuccessBack === CREATE_SUCCESS_BACK.HOME) {
    globalProperties.$router.push(props.redirect)
  }

}

function onFinish () {
  formRef.value.validate().then(() => doSubmit())
}

async function getEntity(id: TId): Promise<TEntity> {
  const result:RestResult<TEntity> = await props.service.get(id);
  const value = {...entity.value, ...result?.data || {}}
  const afterValue = await props.postGetEntity(value as TEntity)

  for (const key in entity.value) {
    if (value[key] === undefined) {
      continue;
    }
    entity.value[key] = afterValue[key]
  }

  const ct = (value as { creationTime?: number }).creationTime
  if (ct != null) {
    creationTime.value = ct
  }
  return afterValue;
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
  currentRoute.value = globalProperties.$route;
  await nextTick()
  await doPostMounted()
}

async function doPostMounted() {
  if (props.postMounted) {
    await props.postMounted()
  }
  updateTitle(entity.value as TEntity)
  spinning.value = false
}

function updateTitle(entity: TEntity | TBody, updateCurrentBreadcrumbs:boolean = true) {
  if(!currentRoute.value) {
    return ;
  }

  const title = props.titleText(getRouteTitle(currentRoute.value.name), entity as TEntity)
  if (updateCurrentBreadcrumbs) {
    const currentBreadcrumbs = [...menuPrincipalStore.state.currentBreadcrumbs];
    const last = currentBreadcrumbs.at(-1)
    if (last) {
      last.name = title;
    }
    menuPrincipalStore.setCurrentBreadcrumbs(currentBreadcrumbs);
  }
  setPaneName?.(currentRoute.value.fullPath as string, title)
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

watch(
  () => i18n.global.locale.value,
  () => {
    if (entity.value) {
      updateTitle(entity.value, false)
    }
  },
)

</script>

<template>
  <div>

    <l-menu-title-card >
      <l-form id="form" ref="formRef" @finish="onFinish" :model="entity">
        <a-spin :spinning="spinning">
          <a-row :gutter="[configProviderStore.getToken().sizeMD]">
            <slot name="rowLayout"></slot>
          </a-row>
          <slot></slot>
          <div v-if="entity.id && creationTime" class="mb-md">
            <a-divider orientation="left" plain>
              <a-space>
                <icon-font class="icon align" type="loncra-timer-reset" />
                <span>{{ globalProperties.$t('form.operationDataTrace') }}</span>
              </a-space>
            </a-divider>
            <l-operation-data-trace-table hide-title detailView :date="creationTime" :query="{'filter_[data.operationTrace.target_eq]': props.operationDataTraceTarget, 'filter_[data.operationTrace.id_eq]':entity.id}"/>
          </div>
          <a-space>
            <slot name="beforeButton"></slot>
            <a-button v-if="resolvedSaveButton.show" type="primary" html-type="submit" :loading="spinning">
              <template #icon>
                <icon-font class="icon" :type="resolvedSaveButton.icon" />
              </template>
              <span>{{ resolvedSaveButton.text }}</span>
            </a-button>

            <a-button v-if="resolvedResetButton.show" html-type="reset" :disabled="spinning">
              <template #icon>
                <icon-font class="icon" :type="resolvedResetButton.icon" />
              </template>
              <span>{{ resolvedResetButton.text}}</span>
            </a-button>

            <slot name="afterButton"></slot>
          </a-space>
        </a-spin>
      </l-form>
    </l-menu-title-card>
  </div>
</template>
