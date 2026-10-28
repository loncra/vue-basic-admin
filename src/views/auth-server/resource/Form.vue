<script setup lang="ts">
import {ref} from 'vue'
import type {ResourceEntity, ResourceSavePayload} from '@loncra/client/auth'
import {CrudFormPage} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {resourceCore} from './resource.page'
import {resourceFormPage} from './resource.form.page'

defineOptions({
  name: 'AuthServerResourceForm',
})

const formRef = ref<{entity?: ResourceSavePayload}>()
const {id} = useRequiredQuery(['id'], {required: false})

const parent = ref<ResourceEntity>()
const contextExtra = {parent}

useEntityPageTitle(
  () => parent.value?.name ?? (formRef.value?.entity?.id ? formRef.value?.entity?.name : undefined),
)

const {onSuccess, onStale, formKey} = useFormSuccessBack({
  redirect: resourceCore.routes?.home,
  entity: () => formRef.value?.entity,
})
</script>

<template>
  <crud-form-page
    ref="formRef"
    :key="formKey"
    :id="id"
    :page="resourceFormPage"
    :context-extra="contextExtra"
    @success="onSuccess"
    @stale="onStale"
  />
</template>
