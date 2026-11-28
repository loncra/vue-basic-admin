<script setup lang="ts">
import {ref} from 'vue'
import {App} from 'antdv-next'
import {CrudHomePage, type CrudHomePageExpose, Form as LForm} from '@loncra/antdv-pro'
import {
  AiSkillPackageService,
  type SkillPackageEntity,
  type SkillReleaseEntity
} from '@loncra/client/ai'
import {DATA_STATUS, getEnumValue} from '@loncra/client/commons'
import {SkillReleaseChangeLog} from '@loncra/antdv-chat-pro'
import {skillPackageService} from './skill-package.page'
import {skillPackageHomePage, skillSnapshot} from './skill-package.home.page'

defineOptions({
  name: 'AiServerSkillPackageHome',
})

const {message} = App.useApp()

const table = ref<CrudHomePageExpose<SkillPackageEntity>>()
const snapshotFormRef = ref()
const releaseCache = ref(new Map<number, SkillReleaseEntity[]>())
const releaseLoading = ref(new Set<number>())
const releaseService = new AiSkillPackageService()

async function loadReleases(record: SkillPackageEntity): Promise<void> {
  const packageId = Number(record.id)
  if (!packageId || releaseCache.value.has(packageId) || releaseLoading.value.has(packageId)) {
    return
  }
  releaseLoading.value = new Set(releaseLoading.value).add(packageId)
  try {
    const result = await releaseService.listReleases(packageId)
    releaseCache.value = new Map(releaseCache.value).set(packageId, result.data || [])
  } finally {
    const next = new Set(releaseLoading.value)
    next.delete(packageId)
    releaseLoading.value = next
  }
}

async function onSnapshotOk(): Promise<void> {
  await snapshotFormRef.value?.validate()
  const snapshot = skillSnapshot.value
  if (!snapshot.packageId || snapshot.spinning) {
    return
  }
  snapshot.spinning = true
  try {
    const result = await skillPackageService.snapshot(snapshot.packageId, snapshot.form)
    void message.success(result.message)
    snapshot.open = false
    await table.value?.fetchDataSource()
  } finally {
    snapshot.spinning = false
  }
}

function cancelSnapshot(): void {
  snapshotFormRef.value?.resetFields?.()
}
</script>

<template>
  <div>
    <crud-home-page
      ref="table"
      :page="skillPackageHomePage"
      :expandable="{
        rowExpandable: (record: SkillPackageEntity) =>
          getEnumValue(record.status) === DATA_STATUS.RELEASE,
        onExpand: (expanded: boolean, record: SkillPackageEntity) => {
          if (expanded) void loadReleases(record)
        },
      }"
    >
      <template #expandedRowRender="{record}">
        <a-flex vertical gap="middle">
          <a-typography-text>
            {{ $t('agent.hub.changelog.text') }}
          </a-typography-text>
          <skill-release-change-log
            :data-source="releaseCache.get(Number(record.id)) ?? []"
            :loading="releaseLoading.has(Number(record.id))"
          />
        </a-flex>
      </template>
    </crud-home-page>

    <a-modal
      v-model:open="skillSnapshot.open"
      :title="$t('aiServer.skillPackage.snapshot.title')"
      :ok-text="$t('aiServer.skillPackage.snapshot.text')"
      :confirm-loading="skillSnapshot.spinning"
      :mask-closable="false"
      destroy-on-hidden
      @ok="onSnapshotOk"
      @cancel="cancelSnapshot"
    >
      <l-form id="snapshot-form" ref="snapshotFormRef" :model="skillSnapshot.form" @finish="onSnapshotOk">
        <a-form-item
          name="releaseVersion"
          :label="$t('aiServer.skillPackage.snapshot.releaseVersion.text')"
          :rules="[{required: true}]"
        >
          <a-input
            v-model:value="skillSnapshot.form.releaseVersion"
            :placeholder="$t('aiServer.skillPackage.snapshot.releaseVersion.placeholder')"
          />
        </a-form-item>
        <a-form-item
          name="changelog"
          :label="$t('aiServer.skillPackage.snapshot.changelog')"
        >
          <a-textarea
            v-model:value="skillSnapshot.form.changelog"
            :rows="4"
            show-count
            :maxlength="512"
          />
        </a-form-item>
      </l-form>
    </a-modal>
  </div>
</template>
