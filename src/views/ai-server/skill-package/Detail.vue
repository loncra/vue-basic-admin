<script setup lang="ts">
import {ref} from 'vue'
import type {GitSkillSourceMetadata, SkillPackageEntity} from '@loncra/client/ai'
import {AI_SERVER_SKILL_SOURCE_TYPE} from '@loncra/client/ai'
// ⚠️ 必须显式 import `CrudDetailPage`：宿主 `src/components` 下的旧 kit 渲染器被
// unplugin-vue-components 自动注册成了**全局**同名组件 ⇒ 漏 import 不报错、静默跑旧 kit（2026-09-28 踩过）
import {CrudDetailPage, FileEditor as LFileEditor} from '@loncra/antdv-pro'
import {getEnumValue} from '@loncra/client/commons'
import {useEntityPageTitle} from '@/composables/useEntityPageTitle'
import {usePageExit} from '@/composables/usePageExit'
import {useRequiredQuery} from '@/composables/useRequiredQuery'
import {useConfigProviderStore} from '@/stores/configProviderStore'
import {skillPackageCore} from './skill-package.page'
import {skillPackageDetailPage} from './skill-package.detail.page'

/**
 * 技能包详情页薄壳：字段、标签、枚举显示、跨列数、执行状态、操作记录都在声明
 * （`skill-package.detail.page.ts` / `skill-package.page.ts`）；这里只剩四件宿主的事 ——
 * 主键（pro 不认路由）、标题、离场，外加「Git 来源」与「文件列表」两块附表。
 */
defineOptions({
  name: 'AiServerSkillPackageDetail',
})

const configProviderStore = useConfigProviderStore()
const detailRef = ref<{entity?: SkillPackageEntity}>()

/** 详情必须有 id：缺了就摆清错误字段跳 400，且**壳不挂载**；**id 由它一并带出来**（快照） */
const {ok, id} = useRequiredQuery()

/** 标题：旧 `title-text` 是 `标题 (技能包名)` */
useEntityPageTitle(() => detailRef.value?.entity?.name)

/** 记录被删 ⇒ 回列表 + 关 tab（旧 `BasicDetail` 自己干的） */
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
    <!-- 旧 `BasicDetail` 的同名插槽：描述列表之后、操作记录之前 -->
    <template #afterDescriptions="{entity}">
      <!-- Git 来源：按来源类型整体显隐（旧页面那段 `<template v-if>`） -->
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
      <l-file-editor
        v-if="entity.id"
        readonly
        bucket="system.file"
        :path="'ai/skill/' + entity.id + '/'"
        :name="entity.packageKey"
      />
    </template>
  </crud-detail-page>
</template>
