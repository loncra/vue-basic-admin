<script setup lang="ts">
import {ref} from 'vue'
import type {GitSkillSourceMetadata, SkillPackageSavePayload} from '@loncra/client/ai'
import {AI_SERVER_SKILL_SOURCE_TYPE} from '@loncra/client/ai'
import {getEnumValue} from '@loncra/client/commons'
import {
  ATTACHMENT_UPLOAD_MODE,
  AttachmentUpload,
  type AttachmentUploadExpose,
  CrudFormPage,
} from '@loncra/antdv-pro'
import {FileEditor} from '@loncra/antdv-chat-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {skillPackageCore} from './skill-package.page'
import {skillPackageFormPage} from './skill-package.form.page'

defineOptions({
  name: 'AiServerSkillPackageForm',
})

const formRef = ref<{entity?: SkillPackageSavePayload}>()

const {id} = useRequiredQuery(['id'], {required: false})

const attachmentUploadRef = ref<AttachmentUploadExpose>()

useEntityPageTitle(() => {
  const entity = formRef.value?.entity
  return entity?.id ? entity.name : undefined
})

const {onSuccess, onStale, formKey} = useFormSuccessBack({
  redirect: skillPackageCore.routes?.home,
  entity: () => formRef.value?.entity,
})
</script>

<template>
  <crud-form-page
    ref="formRef"
    :key="formKey"
    :id="id"
    :page="skillPackageFormPage"
    :context-extra="{uploadAttachments: () => attachmentUploadRef?.upload()}"
    @success="onSuccess"
    @stale="onStale"
  >
    <template #default="{entity}">
      <a-form-item
        v-if="getEnumValue(entity.sourceType) === AI_SERVER_SKILL_SOURCE_TYPE.GIT"
        :name="['metadata', 'source', 'url']"
        :label="$t('aiServer.skillPackage.git.url')"
        :rules="[{required: true}]"
      >
        <a-space-compact block>
          <a-input v-model:value="(entity.metadata.source as GitSkillSourceMetadata).url" />
          <a-space-addon>
            <a-space>
              <a-tooltip :title="$t('aiServer.skillPackage.git.path.subTitle')">
                <icon-font type="loncra-circle-question-mark"></icon-font>
              </a-tooltip>
              <span>{{ $t('aiServer.skillPackage.git.path.title') }}</span>
            </a-space>
          </a-space-addon>
          <a-input
            class="w-70"
            v-model:value="(entity.metadata.source as GitSkillSourceMetadata).path"
          />
          <a-space-addon>
            <a-space>
              <a-tooltip :title="$t('aiServer.skillPackage.git.ref.subTitle')">
                <icon-font type="loncra-circle-question-mark"></icon-font>
              </a-tooltip>
              <span>{{ $t('aiServer.skillPackage.git.ref.title') }}</span>
            </a-space>
          </a-space-addon>
          <a-input
            class="w-50"
            v-model:value="(entity.metadata.source as GitSkillSourceMetadata).ref"
          />
          <a-space-addon>
            <a-space>
              <a-tooltip :title="$t('aiServer.skillPackage.git.sha.subTitle')">
                <icon-font type="loncra-circle-question-mark"></icon-font>
              </a-tooltip>
              <span>{{ $t('aiServer.skillPackage.git.sha.title') }}</span>
            </a-space>
          </a-space-addon>
          <a-input
            class="w-70"
            v-model:value="(entity.metadata.source as GitSkillSourceMetadata).sha"
          />
        </a-space-compact>
      </a-form-item>

      <a-form-item name="tags" :label="$t('aiServer.skillPackage.tags')">
        <a-select
          class="w-full"
          mode="tags"
          max-tag-count="responsive"
          v-model:value="entity.tags"
        />
      </a-form-item>

      <a-form-item
        v-if="
          entity.id !== undefined ||
          getEnumValue(entity.sourceType) === AI_SERVER_SKILL_SOURCE_TYPE.MANUAL
        "
        name="files"
        :label="$t('aiServer.skillPackage.files')"
      >
        <a-flex gap="middle" vertical>
          <attachment-upload
            v-if="entity.id === undefined"
            directory
            ref="attachmentUploadRef"
            :upload-options="{param: {prefix: 'ai/skill/' + entity.id, randomName: false}}"
            bucket="system.file"
            :mode="ATTACHMENT_UPLOAD_MODE.DRAGGER"
          />
          <file-editor
            v-else
            bucket="system.file"
            :path="'ai/skill/' + entity.id + '/'"
            :name="entity.packageKey"
          />
        </a-flex>
      </a-form-item>

      <a-form-item name="summary" :label="$t('aiServer.skillPackage.summary')">
        <a-textarea
          v-model:value="entity.summary"
          :rows="4"
          show-count
          :maxlength="512"
        />
      </a-form-item>

      <a-form-item
        name="additionalInformation"
        :label="$t('aiServer.skillPackage.additionalInformation')"
      >
        <a-textarea
          v-model:value="entity.additionalInformation"
          :rows="4"
          show-count
          :maxlength="512"
        />
      </a-form-item>
    </template>
  </crud-form-page>
</template>
