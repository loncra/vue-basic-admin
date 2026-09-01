<script setup lang="ts">
import {AiSkillPackageService} from '@/apis'
import type {RestResult, SkillReleaseEntity} from '@/types/apis'
import {requireNonNullOrUndefined} from '@/utils'
import {type ComponentInternalInstance, computed, getCurrentInstance, ref, watch} from 'vue'

defineOptions({
  name: 'LAgentHubSkillReleaseChangeLog',
})

const props = defineProps<{
  packageId: number
}>()

const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
  getCurrentInstance(),
).appContext.config.globalProperties

const releases = ref<SkillReleaseEntity[]>([])
const activeKey = ref<string>()
const loading = ref(false)

const tabItems = computed(() =>
  releases.value
    .filter((item) => item.id != null)
    .map((item) => ({
      key: String(item.id),
      label: item.releaseVersion,
    })),
)

const activeRelease = computed(() =>
  releases.value.find((item) => String(item.id) === activeKey.value),
)

function hasChangelog(changelog?: string) {
  return Boolean(changelog?.trim())
}

async function loadReleases(packageId: number) {
  loading.value = true
  try {
    const result: RestResult<SkillReleaseEntity[]> =
      await AiSkillPackageService.listReleases(packageId)
    releases.value = result.data || []
    const first = releases.value.find((item) => item.id != null)
    activeKey.value = first?.id == null ? undefined : String(first.id)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.packageId,
  (packageId) => {
    loadReleases(packageId)
  },
  {immediate: true},
)
</script>

<template>
  <a-spin :spinning="loading">
    <a-empty v-if="!loading && !tabItems.length" />
    <a-tabs
      v-else-if="tabItems.length"
      v-model:active-key="activeKey"
      tab-placement="left"
      size="small"
      :classes="{ item: 'pl-0 m-0' }"
      :items="tabItems"
    >
      <template #contentRender>
        <a-flex v-if="activeRelease" gap="small" vertical class="w-full">
          <a-flex justify="space-between" align="center">
            <span>{{ activeRelease.releaseVersion }}</span>
            <a-typography-text v-if="activeRelease.releaseTime" type="secondary" class="text-xs">
              {{ globalProperties.$dayjs(activeRelease.releaseTime).fromNow() }}
            </a-typography-text>
          </a-flex>
<!--          <div v-if="hasChangelog(activeRelease.changelog)" class="max-h-30 w-full overflow-auto">-->
          <div v-if="hasChangelog(activeRelease.changelog)">
            {{ activeRelease.changelog }}
          </div>
          <a-empty v-else />
        </a-flex>
      </template>
    </a-tabs>
  </a-spin>
</template>
