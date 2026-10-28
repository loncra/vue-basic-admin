<script setup lang="ts">
import {computed, h} from 'vue'
import {Space} from 'antdv-next'
import {FileAddOutlined} from '@antdv-next/icons'
import {CrudFormModal} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import {
  enterpriseInvitationFormPage
} from '@/views/auth-server/enterprise-invitation/enterprise-invitation.form.page.ts'

defineOptions({
  name: 'AuthServerEnterpriseInvitationForm',
})

const open = defineModel<boolean>('open', {default: false})
const emit = defineEmits<{success: []}>()

const title = computed(() =>
  h(Space, null, {
    default: () => [
      h(FileAddOutlined),
      i18n.global.t('common.add', {
        name: ' ' + i18n.global.t('authServer.enterpriseInvitation.routePage'),
      }),
    ],
  }),
)

function onSuccess(): void {
  open.value = false
  emit('success')
}
</script>

<template>
  <crud-form-modal
    v-model:open="open"
    :page="enterpriseInvitationFormPage"
    :title="title"
    @success="onSuccess"
  />
</template>
