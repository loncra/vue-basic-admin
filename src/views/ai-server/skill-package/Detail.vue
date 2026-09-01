<script setup lang="ts">
import LBasicDetail from '@/components/basic/BasicDetail.vue'
import {AiSkillPackageService} from '@/apis/ai-server/aiSkillPackageService.ts'
import {getEnumName, getEnumValue, getExecuteBadgeStatus, requireNonNullOrUndefined} from '@/utils'
import {type ComponentInternalInstance, getCurrentInstance, ref} from 'vue'
import type {
  GitSkillSourceMetadata,
  ManualSkillSourceMetadata,
  SkillPackageEntity
} from '@/types/apis'
import {
  ICON_SELECT_MODE,
  OPERATION_DATA_TRACE_TABLE,
  SKILL_PACKAGE_ROUTE,
  SKILL_SOURCE_TYPE,
  SKILL_UPDATE_POLICY,
} from '@/constants'
import {useConfigProviderStore} from '@/stores/configProviderStore.ts'
import LIconSelect from '@/components/basic/IconSelect.vue'
import LFileEditor from '@/components/attachment/FileEditor.vue'

defineOptions({
  name: 'AiServerSkillPackageDetail',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new AiSkillPackageService()

const entity = ref<SkillPackageEntity>({
  id: 0,
  version: 0,
  name: '',
  packageKey: '',
  summary: '',
  tags: [],
  additionalInformation: '',
  origin: 0,
  status: 0,
  type: 0,
  icon: '',
  defaultUpdatePolicy: 0,
  sourceType: 0,
  metadata: {
    source: {type: SKILL_SOURCE_TYPE.MANUAL} as ManualSkillSourceMetadata,
  },
})

const configProviderStore = useConfigProviderStore()

function postGetEntity(record: SkillPackageEntity) {
  if (!record.metadata) {
    record.metadata = {source: {type: SKILL_SOURCE_TYPE.MANUAL} as ManualSkillSourceMetadata}
  }
  if (!record.metadata.source) {
    record.metadata.source = {type: SKILL_SOURCE_TYPE.MANUAL} as ManualSkillSourceMetadata
  }
  return record
}

</script>

<template>
  <div>
    <l-basic-detail
      :post-get-entity="postGetEntity"
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.AI_SKILL_PACKAGE"
      :redirect="{name: SKILL_PACKAGE_ROUTE.HOME}"
      :title-text="(title: string, record: SkillPackageEntity) => title + ' (' + record.name + ')'"
      :service="service"
      :column="{xxxl: 3, xxl: 3, xl: 3, lg: 3, md: 1, sm: 1, xs: 1}"
      v-model:entity="entity"
    >
      <a-descriptions-item :label="globalProperties.$t('common.id')">
        {{ entity.id }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.name')">
        {{ entity.name }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.skillPackage.packageKey')">
        {{ entity.packageKey }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.icon')">
        <l-icon-select :mode="ICON_SELECT_MODE.AVATAR" preview :value="entity.icon" />
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.group')">
        {{ entity.category?.name }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.skillPackage.origin')">
        {{ getEnumName(entity.origin) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.status')">
        {{ getEnumName(entity.status) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.type')">
        {{ getEnumName(entity.type) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.skillPackage.latestVersion')">
        {{ entity.latestVersion || '' }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.skillPackage.defaultUpdatePolicy')">
        {{ getEnumName(entity.defaultUpdatePolicy) }}
        <template
          v-if="
            getEnumValue(entity.defaultUpdatePolicy) === SKILL_UPDATE_POLICY.AUTOMATIC &&
            entity.metadata.updatePolicyTime
          "
        >
          {{ entity.metadata.updatePolicyTime.value }}
          {{ getEnumName(entity.metadata.updatePolicyTime.unit) }}
        </template>
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.skillPackage.sourceType')">
        {{ getEnumName(entity.sourceType) }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.executeStatus')">
        <a-badge
          :status="getExecuteBadgeStatus(entity.executeStatus ?? 0)"
          :text="getEnumName(entity.executeStatus)"
        />
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.skillPackage.summary')" :span="3">
        {{ entity.summary || '' }}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('aiServer.skillPackage.tags')" :span="3">
        {{ (entity.tags || []).join(',') }}
      </a-descriptions-item>
      <a-descriptions-item
        :label="globalProperties.$t('aiServer.skillPackage.additionalInformation')"
        :span="3"
      >
        {{ entity.additionalInformation || '' }}
      </a-descriptions-item>

      <template #afterDescriptions>
        <template v-if="getEnumValue(entity.sourceType) === SKILL_SOURCE_TYPE.GIT">
          <a-divider orientation="left" plain>
            <a-space>
              <icon-font class="icon" type="loncra-git-branch" />
              {{ globalProperties.$t('aiServer.skillPackage.git.url') }}
            </a-space>
          </a-divider>
          <a-descriptions
            class="mb-lg"
            bordered
            :layout="configProviderStore.state.detailLayout"
            :column="{xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1}"
          >
            <a-descriptions-item :label="globalProperties.$t('aiServer.skillPackage.git.url')" :span="2">
              {{ (entity.metadata.source as GitSkillSourceMetadata).url || '' }}
            </a-descriptions-item>
            <a-descriptions-item :label="globalProperties.$t('aiServer.skillPackage.git.path.title')">
              {{ (entity.metadata.source as GitSkillSourceMetadata).path || '' }}
            </a-descriptions-item>
            <a-descriptions-item :label="globalProperties.$t('aiServer.skillPackage.git.ref.title')">
              {{ (entity.metadata.source as GitSkillSourceMetadata).ref || '' }}
            </a-descriptions-item>
            <a-descriptions-item :label="globalProperties.$t('aiServer.skillPackage.git.sha.title')" :span="2">
              {{ (entity.metadata.source as GitSkillSourceMetadata).sha || '' }}
            </a-descriptions-item>
          </a-descriptions>
        </template>
        <a-divider orientation="left" plain>
          <a-space>
            <icon-font class="icon" type="loncra-folder-tree" />
            {{ globalProperties.$t('aiServer.skillPackage.files') }}
          </a-space>
        </a-divider>
        <l-file-editor
          v-if="entity.id"
          readonly
          bucket="system.file"
          :path="'ai/skill/' + entity.id + '/'"
          :name="entity.packageKey"
        />
      </template>
    </l-basic-detail>
  </div>
</template>
