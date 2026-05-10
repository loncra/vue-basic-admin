<script setup lang="ts" generic="TEntity extends BasicIdMetadata<TId>, TId = TEntity[typeof SYSTEM_CONSTANT.ID_NAME]">

import LForm from "@/components/Form.vue";
import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from "vue";
import {SYSTEM_CONSTANT} from "@/constants/systemConstant.ts";
import type {BasicCrudService, BasicIdMetadata, CurdAuthorityProps, RestResult} from "@/types";
import {requireNonNullOrUndefined} from "@/utils";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";

defineOptions({
  name: 'LBasicForm',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const configProviderStore = useConfigProviderStore()

const props = withDefaults(
  defineProps<{
    service: BasicCrudService<TEntity>
    authority?: CurdAuthorityProps
  }>(),
  {
  },
)

const formRef = ref()
const spinning = defineModel<boolean>("spinning", {default: false})
const entity = defineModel<TEntity>("entity", {default: () => {}})

function doSubmit() : void {

}

function onFinish (): void {
  formRef.value.validate().then(() => doSubmit())
}

async function mounted() {
  const id = globalProperties.$route.query[SYSTEM_CONSTANT.ID_NAME] as TId
  if (id) {
    const result:RestResult<TEntity> = await props.service.get(id);
    entity.value = {...result?.data, ...entity.value};
  }
}

onMounted(mounted)

</script>

<template>
  <div>
    <l-menu-title-card>
      <l-form id="form" ref="formRef" @finish="onFinish" :model="entity">
        <a-spin :spinning="spinning">
          <a-row :gutter="[configProviderStore.getToken().marginMD]">
            <slot name="rowLayout"></slot>
          </a-row>
          <slot></slot>
          <a-divider />
          <a-space>
            <a-button type="primary" html-type="submit">
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
