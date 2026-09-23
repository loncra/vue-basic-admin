<script setup lang="ts" generic="TBodyId = unknown, TBody extends BasicIdMetadata<TBodyId> = BasicIdMetadata<TBodyId>, TEntity extends TBody = TBody">

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
} from '@/constants';
import type {BasicCrudService, BasicIdMetadata, RestResult} from "@loncra/client/commons";
import {requireNonNullOrUndefined} from "@/utils";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {App, Checkbox} from "antdv-next";
import {isResultSuccess} from "@/requests/http.ts";
import type {RouteLocationNormalizedLoaded, RouteLocationRaw} from "vue-router";
import {useMenuPrincipalStore} from "@/stores/menuStore.ts";
import {getRouteTitle} from "@/routers";
import {isOperationTraceVisible, OperationTraceTable as LOperationTraceTable} from "@loncra/antdv-pro";
import {HistoryOutlined} from "@antdv-next/icons";
import i18n from "@/i18n";

defineOptions({
  name: 'LBasicForm',
})

/**
 * 主键类型。**不能**写成 `TId = TEntity[...]` 再让 `TBody extends BasicIdMetadata<TId>` 反过来依赖它
 * —— 两者互为依赖，新版 language-tools 推不出来 ⇒ 整个泛型退化成宏签名自带的 `T`。
 * 拆成两半就都成立了：`TBodyId` 约束在 `TBody` 上（`entity.value.id` 因此有类型），
 * `TId` 是 service 那一侧的形状（client 里实体 id 声明为可选，索引出来自带 `undefined`）。
 */
type TId = TBodyId | undefined

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
    service: BasicCrudService<TBody,TEntity,TId>
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
    titleText: (title:string) => title,
  },
)

const formRef = ref()
const spinning = defineModel<boolean>("spinning", {default: false})
const entity = defineModel<TBody>("entity", {required: true})
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
      const id = entity.value.id
      if (!id) {
        createdAfterSetting(result)
      } else {
        message.success(result.message)
        entity.value = await getEntity(id)
        updateTitle(entity.value)
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
      footer: ({ extra }:any) => {
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
    closeLayoutTab?.(globalProperties.$route.fullPath, false);
  }

}

function doReset() {
  formRef.value?.resetFields?.()
  emit('resetFields')
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
  updateTitle(entity.value)
  spinning.value = false
}

function updateTitle(entity: TEntity | TBody, updateCurrentBreadcrumbs:boolean = true) {
  if(!currentRoute.value) {
    return ;
  }

  const title = props.titleText(getRouteTitle(currentRoute.value.name), entity)
  if (updateCurrentBreadcrumbs) {
    const currentBreadcrumbs = [...menuPrincipalStore.state.currentBreadcrumbs];
    const last = currentBreadcrumbs.at(-1)
    if (last) {
      last.name = title;
    }
    menuPrincipalStore.setCurrentBreadcrumbs(currentBreadcrumbs);
  }
  setPaneName?.(currentRoute.value.fullPath, title)
}

async function activated() {
  updateTitle(entity.value)
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
          <!--
            操作记录：pro 的能力（`target` / `entity.id` / `entity.creationTime` 三个值齐了才渲染，
            自己拉数据；想隐藏就不给值）。**分割线归页面**（表格组件只管表格），
            值不齐时连分割线一起不出。下方插槽留给宿主业务内容。
          -->
          <template v-if="isOperationTraceVisible(props.operationDataTraceTarget, entity)">
            <a-divider titlePlacement="start" plain>
              <a-space>
                <history-outlined />
                <span>{{ globalProperties.$t('form.operationDataTrace') }}</span>
              </a-space>
            </a-divider>
            <l-operation-trace-table :target="props.operationDataTraceTarget" :entity="entity" />
          </template>
          <a-space>
            <slot name="beforeButton"></slot>
            <a-button v-if="resolvedSaveButton.show" type="primary" html-type="submit" :loading="spinning">
              <template #icon>
                <icon-font class="icon" :type="resolvedSaveButton.icon" />
              </template>
              <span>{{ resolvedSaveButton.text }}</span>
            </a-button>

            <a-button v-if="resolvedResetButton.show" html-type="button" :disabled="spinning" @click="doReset">
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
