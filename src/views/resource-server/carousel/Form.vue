<script setup lang="ts">
import {computed, getCurrentInstance, ref} from 'vue'
import type {CarouselSavePayload} from '@/types/apis'
import {CrudFormPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {carouselCore} from './carousel.page'
import {carouselFormPage} from './carousel.form.page'

defineOptions({
  name: 'ResourceServerCarouseForm',
})

const globalProperties = getCurrentInstance()!.appContext.config.globalProperties
const formRef = ref<{entity?: CarouselSavePayload}>()

const {id} = useRequiredQuery(['id'], {required: false})
const initialType = globalProperties.$route.query.type as string | undefined

const linkOptions = computed(() => [
  {name: 'http://', value: 'http://'},
  {name: 'https://', value: 'https://'},
  {name: globalProperties.$t('common.applet'), value: 'applet://'},
])

useEntityPageTitle(() => {
  const entity = formRef.value?.entity
  return entity?.id ? entity.name : undefined
})

const {onSuccess, onStale, formKey} = useFormSuccessBack({
  redirect: carouselCore.routes?.home,
  entity: () => formRef.value?.entity,
})
</script>

<template>
  <crud-form-page
    ref="formRef"
    :key="formKey"
    :id="id"
    :page="carouselFormPage"
    :context-extra="{initialType}"
    @success="onSuccess"
    @stale="onStale"
  >
    <template #default="{entity}">
      <a-form-item
        :label="$t('common.link')"
        :name="['link', 'value']"
        :rules="[{required: true, trigger: 'change'}]"
      >
        <a-space-compact block>
          <a-select v-model:value="entity.link.id" style="width: 120px" :options="linkOptions" />
          <a-input v-model:value="entity.link.value" />
        </a-space-compact>
      </a-form-item>

      <a-form-item :label="$t('common.remark')" name="remark">
        <a-textarea v-model:value="entity.remark" :auto-size="{minRows: 5, maxRows: 10}" />
      </a-form-item>
    </template>
  </crud-form-page>
</template>
