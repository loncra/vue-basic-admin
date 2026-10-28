<script setup lang="ts">
import {ref} from 'vue'
import type {GitSkillSourceMetadata, SkillPackageEntity} from '@loncra/client/ai'
import {AI_SERVER_SKILL_SOURCE_TYPE} from '@loncra/client/ai'
import {CrudDetailPage} from '@loncra/antdv-pro'
import {FileEditor} from '@loncra/antdv-chat-pro'
import {getEnumValue} from '@loncra/client/commons'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {useConfigProviderStore} from '@/stores/configProviderStore'
import {skillPackageCore} from './skill-package.page'
import {skillPackageDetailPage} from './skill-package.detail.page'

defineOptions({
  name: 'AiServerSkillPackageDetail',
})

const configProviderStore = useConfigProviderStore()
const detailRef = ref<{entity?: SkillPackageEntity}>()

const {ok, id} = useRequiredQuery()

useEntityPageTitle(() => detailRef.value?.entity?.name)

const {onStale} = usePageExit({redirect: skillPackageCore.routes?.home})
</script>

<template>
  <crud-detail-page
    v-if="ok"
    ref="detailRef"
    :id="id"
    :page="skillPackageDetailPage"
    @stale="onStale"
  >
    <template #afterDescriptions="{entity}">
      <template v-if="getEnumValue(entity.sourceType) === AI_SERVER_SKILL_SOURCE_TYPE.GIT">
        <a-divider titlePlacement="start" plain>
          <a-space>
            <icon-font class="icon" type="loncra-git-branch" />
            {{ $t('aiServer.skillPackage.git.url') }}
          </a-space>
        </a-divider>
        <a-descriptions
          class="mb-lg"
          bordered
          :layout="configProviderStore.antdv.state.detailLayout"
          :column="{xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1}"
        >
          <a-descriptions-item :label="$t('aiServer.skillPackage.git.url')" :span="2">
            {{ (entity.metadata.source as GitSkillSourceMetadata).url || '' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('aiServer.skillPackage.git.path.title')">
            {{ (entity.metadata.source as GitSkillSourceMetadata).path || '' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('aiServer.skillPackage.git.ref.title')">
            {{ (entity.metadata.source as GitSkillSourceMetadata).ref || '' }}
          </a-descriptions-item>
          <a-descriptions-item :label="$t('aiServer.skillPackage.git.sha.title')" :span="2">
            {{ (entity.metadata.source as GitSkillSourceMetadata).sha || '' }}
          </a-descriptions-item>
        </a-descriptions>
      </template>

      <a-divider titlePlacement="start" plain>
        <a-space>
          <icon-font class="icon" type="loncra-folder-tree" />
          {{ $t('aiServer.skillPackage.files') }}
        </a-space>
      </a-divider>
      <file-editor
        v-if="entity.id"
        readonly
        bucket="system.file"
        :path="'ai/skill/' + entity.id + '/'"
        :name="entity.packageKey"
      />
    </template>
  </crud-detail-page>
</template>
