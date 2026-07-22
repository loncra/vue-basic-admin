<script setup lang="ts" generic="TBody extends BasicIdMetadata<TId>, TEntity extends TBody, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import LForm from "@/components/Form.vue";

import {type ComponentInternalInstance, getCurrentInstance, h, ref, watch} from "vue";
import type {BasicCrudService, BasicIdMetadata, RestResult} from "@/types/apis";
import type {BasicAuthorityProps} from "@/types/composables";
import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";
import {isResultSuccess} from "@/requests";
import {App, Button} from "antdv-next";
import {createIcon, requireNonNullOrUndefined} from "@/utils";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import LOperationDataTraceTable from "@/components/auth-server/OperationDataTraceTable.vue";

defineOptions({
  name: 'LModalForm',
})

const { message } = App.useApp()

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const configProviderStore = useConfigProviderStore()

const props = withDefaults(
  defineProps<{
    operationDataTraceTarget:string,
    service: BasicCrudService<TBody,TEntity>
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
const entity = defineModel<TBody>("entity", {default: () => {}})

const open = defineModel<boolean>("open", {default: false})

const emit = defineEmits<{
  (e: 'success', data: RestResult<TId>): void
  (e: 'postGet', data: RestResult<TEntity>, entity:TBody): void
  (e: 'resetFields'): void
  (e: 'cancel'):void
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
      icon: () => createIcon('loncra-save','align'),
      default: () => h('span', null, globalProperties.$t('common.save')),
    }),
    h(Button, {
      class: 'mr',
      onClick: () => {
        formRef.value?.resetFields?.()
        emit('resetFields')
      },
    }, {
      icon: () => createIcon('loncra-history','align'),
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
  if (entity.value.id && (typeof entity.value.id === 'number' && (entity.value.id as number) > 0)) {
    await getEntity(entity.value.id)
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
        <a-divider orientation="left" plain>
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
