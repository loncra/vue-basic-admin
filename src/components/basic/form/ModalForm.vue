<script setup lang="ts" generic="TBodyId = unknown, TBody extends BasicIdMetadata<TBodyId> = BasicIdMetadata<TBodyId>, TEntity extends TBody = TBody">

import LForm from "@/components/Form.vue";

import {type ComponentInternalInstance, getCurrentInstance, h, ref, watch} from "vue";
import type {BasicCrudService, BasicIdMetadata, RestResult} from "@loncra/client/commons";
import type {BasicAuthorityProps} from "@/types/composables";
import {isResultSuccess} from "@/requests";
import {App, Button} from "antdv-next";
import {requireNonNullOrUndefined} from "@/utils";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import LOperationDataTraceTable from "@/components/auth-server/OperationDataTraceTable.vue";
import {renderIconFont} from '@/utils/commonUtils'


defineOptions({
  name: 'LModalForm',
})

/** 主键类型：见 `BasicForm.vue` 同名说明（`TBodyId` 约束主体、`TId` 是 service 那一侧的形状）。 */
type TId = TBodyId | undefined

const { message } = App.useApp()

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const configProviderStore = useConfigProviderStore()

const props = withDefaults(
  defineProps<{
    operationDataTraceTarget:string,
    service: BasicCrudService<TBody,TEntity,TId>
    authority?: BasicAuthorityProps
    preMounted?: () => void
    postMounted?: () => void
  }>(),
  {

  },
)

const formRef = ref()
const creationTime = ref<number>()
const loading = defineModel<boolean>("spinning", {default: false})
const entity = defineModel<TBody>("entity", {required: true})

const open = defineModel<boolean>("open", {default: false})

const emit = defineEmits<{
  success: [data: RestResult<TId>]
  postGet: [data: RestResult<TEntity>, entity:TBody]
  resetFields: []
  cancel:[]
}>()

async function doSubmit() {
  loading.value = true
  try {
    const result = await props.service.save(entity.value)
    if(!isResultSuccess(result)) {
      message.warning(result.message)
      return ;
    }
    if(result.status === 200) {
      message.success(result.message)
      emit("success", result)
    } else {
      message.error(result.message)
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : String(error))
  } finally {
    loading.value = false
  }
}

function onFinish () {
  formRef.value.validate().then(() => doSubmit())
}

function cancel() {
  open.value = false;
  formRef.value?.resetFields?.()
  emit('cancel')
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

const footer = () => {
  return [
    h(Button, {
      class: 'mr',
      type: 'primary',
      onClick: onFinish,
    }, {
      icon: () => renderIconFont('loncra-save','align'),
      default: () => h('span', null, globalProperties.$t('common.save')),
    }),
    h(Button, {
      class: 'mr',
      onClick: () => {
        formRef.value?.resetFields?.()
        emit('resetFields')
      },
    }, {
      icon: () => renderIconFont('loncra-history','align'),
      default: () => h('span', null, globalProperties.$t('common.reset')),
    }),
  ]
}

async function mounted() {
  if (!open.value) {
    return ;
  }
  loading.value = true
  props?.preMounted?.()
  const id = entity.value.id
  if (typeof id === 'number' && id > 0) {
    await getEntity(id)
  }
  loading.value = false
  props?.postMounted?.()
}

watch(() => open.value, () => mounted())

defineExpose({
  cancel
})

</script>

<template>
  <a-modal
    v-model:open="open"
    :loading="loading"
    v-bind="$attrs"
    :confirm-loading="loading"
    :mask-closable="false"
    @ok="onFinish"
    @cancel="cancel"
    :footer="footer"
  >
    <l-form id="form" ref="formRef" @finish="onFinish" :model="entity">
      <a-row :gutter="[configProviderStore.getToken().marginMD]">
        <slot name="rowLayout"></slot>
      </a-row>
      <slot></slot>
      <div v-if="entity.id && creationTime" class="mb-md">
        <a-divider titlePlacement="start" plain>
          <a-space>
            <icon-font class="icon" type="loncra-timer-reset" />
            <span>{{ globalProperties.$t('form.operationDataTrace') }}</span>
          </a-space>
        </a-divider>
        <l-operation-data-trace-table detailView :date="creationTime" :query="{'filter_[data.operationDataTrace.target_eq]': props.operationDataTraceTarget, 'filter_[data.operationDataTrace.entityId_eq]':entity.id}"/>
      </div>
    </l-form>
  </a-modal>
</template>
