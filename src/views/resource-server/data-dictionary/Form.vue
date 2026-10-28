<script setup lang="ts">
import {ref} from 'vue'
import type {DataDictionarySavePayload} from '@loncra/client/resource'
import {CrudFormPage} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {RESOURCE_SERVER_DATA_DICTIONARY_ROUTE} from '@/constants'
import {dataDictionaryFormPage, dictionaryFormContext} from './data-dictionary.form.page'

defineOptions({
  name: 'ResourceServerDataDictionaryForm',
})

const {ok, id} = useRequiredQuery(['id', 'parentId', 'typeId'], {anyOf: true})

const formRef = ref<{entity?: DataDictionarySavePayload}>()

useEntityPageTitle(() => {
  const {type, parent} = dictionaryFormContext.value
  const entity = formRef.value?.entity
  if (parent) {
    return parent.name
  }
  if (entity?.id) {
    return i18n.global.t('resourceServer.dataDictionary.editPage', {
      typeName: type?.name,
      dataName: entity.name,
    })
  }
  return type?.name
})

const {onSuccess, onStale, formKey} = useFormSuccessBack({
  redirect: () => ({
    name: RESOURCE_SERVER_DATA_DICTIONARY_ROUTE.HOME,
    query: {typeId: formRef.value?.entity?.typeId},
  }),
  entity: () => formRef.value?.entity,
})
</script>

<template>
  <crud-form-page
    v-if="ok"
    ref="formRef"
    :key="formKey"
    :id="id"
    :page="dataDictionaryFormPage"
    @success="onSuccess"
    @stale="onStale"
  />
</template>
