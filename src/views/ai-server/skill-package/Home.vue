<script setup lang="ts">
import {ref} from 'vue'
import {App} from 'antdv-next'
import {CrudHomePage as LCrudHomePage, type CrudHomePageExpose} from '@loncra/antdv-pro'
import type {SkillPackageEntity} from '@loncra/client/ai'
import {getEnumValue} from '@loncra/client/commons'
import LForm from '@/components/Form.vue'
import LAgentHubSkillReleaseChangeLog from '@/components/ai-server/agent/hub/SkillReleaseChangeLog.vue'
import {DATA_STATUS} from '@/constants'
import {skillPackageService} from './skill-package.page'
import {skillPackageHomePage, skillSnapshot} from './skill-package.home.page'

defineOptions({
  name: 'AiServerSkillPackageHome',
})

const {message} = App.useApp()

const table = ref<CrudHomePageExpose<SkillPackageEntity>>()
const snapshotFormRef = ref()

/** 快照提交：校验表单 → 调接口 → 提示 → 关弹层 → 刷新列表（业务留在壳里，因为表单 ref 在这儿） */
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
    <l-crud-home-page
      ref="table"
      :page="skillPackageHomePage"
      :scroll="{x: 'max-content'}"
      :expandable="{
        rowExpandable: (record: SkillPackageEntity) =>
          getEnumValue(record.status) === DATA_STATUS.RELEASE,
      }"
    >
      <template #expandedRowRender="{record}">
        <a-flex vertical gap="middle">
          <a-typography-text>
            {{ $t('agent.hub.changelog.text') }}
          </a-typography-text>
          <l-agent-hub-skill-release-change-log :package-id="Number(record.id)" />
        </a-flex>
      </template>
    </l-crud-home-page>

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
