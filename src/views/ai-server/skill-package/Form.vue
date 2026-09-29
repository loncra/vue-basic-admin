<script setup lang="ts">
import {ref} from 'vue'
import {useRoute} from 'vue-router'
import type {GitSkillSourceMetadata, SkillPackageSavePayload} from '@loncra/client/ai'
import {AI_SERVER_SKILL_SOURCE_TYPE} from '@loncra/client/ai'
import {getEnumValue} from '@loncra/client/commons'
import {
  ATTACHMENT_UPLOAD_MODE,
  type AttachmentUploadExpose,
  CrudFormPage,
  FileEditor as LFileEditor,
  AttachmentUpload as LAttachmentUpload,
} from '@loncra/antdv-pro'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {useFormSuccessBack} from '@/composables/useFormSuccessBack'
import {SYSTEM_CONSTANT} from '@/constants'
import {skillPackageCore} from './skill-package.page'
import {skillPackageFormPage} from './skill-package.form.page'

/**
 * 技能包新增/编辑页薄壳：字段、校验、初值、枚举来源、图标/分组/更新策略三处组合控件、
 * 以及 `preMounted`/`postSubmit` 都在声明（`skill-package.form.page.ts` / `skill-package.page.ts`）。
 *
 * 这里只剩：主键与标题、离场，外加**字段行之后的五块**（旧页面它们就在 `#rowLayout` 之外）
 * —— Git 来源（带 `['metadata','source','url']` 嵌套校验）、标签、文件、简介、附加信息。
 * 之所以留在壳里：① **顺序与旧页面完全一致**（声明里的字段会全部排在插槽之前）；
 * ② 文件那块要用宿主组件（`AttachmentUpload` / `FileEditor`）与它的 `ref`。
 */
defineOptions({
  name: 'AiServerSkillPackageForm',
})

const route = useRoute()
const formRef = ref<{entity?: SkillPackageSavePayload}>()

/** 主键：进页面那一刻取一次（快照）；新增态没有 id ⇒ pro 不取数 */
const id = route.query[SYSTEM_CONSTANT.ID_NAME] as number | undefined

/** 新增态选好的附件：`postSubmit` 里（声明侧）要拿它上传，所以从壳递进去 */
const attachmentUpload = ref<AttachmentUploadExpose>()

/** 标题：旧 `title-text` 是 `标题 (技能包名)`，新增态只给基标题 */
useEntityPageTitle(() => {
  const entity = formRef.value?.entity
  return entity?.id ? entity.name : undefined
})

/** 保存成功后的去向（旧页面 `:redirect="{name: SKILL_PACKAGE_ROUTE.HOME}"`） */
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
    :context-extra="{uploadAttachments: () => attachmentUpload?.upload()}"
    @success="onSuccess"
    @stale="onStale"
  >
    <!-- 字段行之后（旧页面同一顺序） -->
    <template #default="{entity}">
      <!-- Git 来源：整块按来源类型显隐，url 是**嵌套路径**的必填项 -->
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

      <!-- 文件：新建态用上传（挂到刚建出来的 id 上），编辑态用文件编辑器 -->
      <a-form-item
        v-if="
          entity.id !== undefined ||
          getEnumValue(entity.sourceType) === AI_SERVER_SKILL_SOURCE_TYPE.MANUAL
        "
        name="files"
        :label="$t('aiServer.skillPackage.files')"
      >
        <a-flex gap="middle" vertical>
          <l-attachment-upload
            v-if="entity.id === undefined"
            directory
            ref="attachmentUpload"
            :upload-options="{param: {prefix: 'ai/skill/' + entity.id, randomName: false}}"
            bucket="system.file"
            :mode="ATTACHMENT_UPLOAD_MODE.DRAGGER"
          />
          <l-file-editor
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
