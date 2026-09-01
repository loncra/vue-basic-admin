<script setup lang="ts">
import {AiUserPluginInstallService, ResourceServerService} from '@/apis'
import LAgentHubPluginInfoCard from '@/components/ai-server/agent/hub/PluginInfoCard.vue'
import LAgentHubSkillReleaseChangeLog from '@/components/ai-server/agent/hub/SkillReleaseChangeLog.vue'
import {
  DEFAULT_PAGE_RESULT_VALUE,
  PLUGIN_TARGET_TYPE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import type {
  IdValueMetadata,
  McpPackageEntity,
  RestResult,
  SkillPackageEntity,
  TotalPage,
  UserPluginInstallResult,
} from '@/types/apis'
import {getEnumValue, requireNonNullOrUndefined} from '@/utils'
import {type ComponentInternalInstance, computed, getCurrentInstance, onMounted, ref} from 'vue'

defineOptions({
  name: 'LAgentHubMyPlugin',
})

const props = withDefaults(
  defineProps<{
    installs?: UserPluginInstallResult[]
  }>(),
  {
    installs: () => [],
  },
)

const emits = defineEmits<{
  installed: [result: UserPluginInstallResult]
  uninstalled: [id: number]
}>()

const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
  getCurrentInstance(),
).appContext.config.globalProperties

const targetTypes = ref<IdValueMetadata<number, string>[]>([])
const activeKey = ref<string>()

const activeType = computed(() => {
  if (activeKey.value == null || activeKey.value === '') {
    return undefined
  }
  return Number(activeKey.value)
})

const mcpDataSource = computed(() => toPage(packagesOf(PLUGIN_TARGET_TYPE.MCP) as McpPackageEntity[]))

const skillDataSource = computed(() =>
  toPage(packagesOf(PLUGIN_TARGET_TYPE.SKILL) as SkillPackageEntity[]),
)

function packagesOf(targetType: number) {
  return props.installs
    .filter((item) => getEnumValue(item.targetType) === targetType)
    .map((item) => item.pluginPackage)
    .filter((item) => item != null)
}

function toPage<T>(elements: T[]): TotalPage<T> {
  return {
    ...DEFAULT_PAGE_RESULT_VALUE,
    elements,
    number: 1,
    size: elements.length || 10,
    totalCount: elements.length,
    totalPages: 1,
    first: true,
    last: true,
  }
}

function tabIcon(id?: number) {
  if (id === PLUGIN_TARGET_TYPE.SKILL) {
    return 'loncra-sparkles'
  }
  if (id === PLUGIN_TARGET_TYPE.MCP) {
    return 'loncra-plug-zap'
  }
  return 'loncra-package'
}

function isSkillOutdated(record: SkillPackageEntity) {
  return AiUserPluginInstallService.isSkillOutdated(props.installs, record)
}

function workspacesOf(record: {id?: number}, targetType: number) {
  if (record.id == null) {
    return []
  }
  return (
    AiUserPluginInstallService.mapInstallsByPackageId(props.installs, targetType).get(record.id)
      ?.workspaces || []
  )
}

function workspaceTags(record: {id?: number}, targetType: number) {
  const workspaces = workspacesOf(record, targetType)
  if (workspaces.length) {
    return workspaces
  }
  return [{id: 'all', name: globalProperties.$t('agent.hub.workspaceScope.all')}]
}

function onChangePage(_page: number, _pageSize: number) {
  return
}

async function mounted() {
  const result: RestResult<IdValueMetadata<number, string>[]> =
    await ResourceServerService.getServiceEnumerate(
      SYSTEM_MODULE_NAME.AI_SERVER,
      SYSTEM_ENUM_TYPE.PLUGIN_TARGET_TYPE_ENUM,
    )
  targetTypes.value = result.data || []
  const first = targetTypes.value.at(0)
  if (first?.id != null) {
    activeKey.value = String(first.id)
  }
}

onMounted(mounted)
</script>

<template>
  <a-tabs
    v-model:active-key="activeKey"
    tab-placement="left"
    :classes="{
      root: 'min-h-0 h-full',
      body: 'min-h-0 h-full overflow-hidden',
      item: 'pl-0 m-0',
      content: 'min-h-0 h-full ',
    }"
    :items="targetTypes.map((item) => ({label: item.value, key: String(item.id)}))"
  >
    <template #labelRender="{ item }">
      <a-flex gap="small">
        <icon-font class="m-0" :type="tabIcon(Number(item.key))" />
        <span>{{ item.label }}</span>
      </a-flex>
    </template>
    <template #contentRender>
      <l-agent-hub-plugin-info-card
        v-if="activeType === PLUGIN_TARGET_TYPE.MCP"
        :data-source="mcpDataSource"
        :installs="props.installs"
        :target-type="PLUGIN_TARGET_TYPE.MCP"
        @change-page="onChangePage"
        @installed="emits('installed', $event)"
        @uninstalled="emits('uninstalled', $event)"
      >
        <template #title="{ record }">
          {{ record.name }}
        </template>
        <template #after="{ record }">
          <a-space wrap>
            <a-tag v-for="workspace of workspaceTags(record, PLUGIN_TARGET_TYPE.MCP)" :key="workspace.id">
              {{ workspace.name }}
            </a-tag>
          </a-space>
        </template>
      </l-agent-hub-plugin-info-card>
      <l-agent-hub-plugin-info-card
        v-else-if="activeType === PLUGIN_TARGET_TYPE.SKILL"
        :data-source="skillDataSource"
        :installs="props.installs"
        :target-type="PLUGIN_TARGET_TYPE.SKILL"
        @change-page="onChangePage"
        @installed="emits('installed', $event)"
        @uninstalled="emits('uninstalled', $event)"
      >
        <template #title="{ record }">
          <a-badge :dot="isSkillOutdated(record)">
            {{ record.name }} {{ record.latestVersion }}
          </a-badge>
        </template>
        <template #after="{ record }">
          <a-flex vertical gap="small" class="w-full">
            <a-space wrap>
              <a-tag v-for="workspace of workspaceTags(record, PLUGIN_TARGET_TYPE.SKILL)" :key="workspace.id">
                {{ workspace.name }}
              </a-tag>
            </a-space>
            <a-collapse
              ghost
              :classes="{body: 'p-0', header: 'pl-0 pr-0 border-t border-border-secondary'}"
              :items="[{key: 'changelog', label: globalProperties.$t('agent.hub.changelog.text')}]"
            >
              <template #contentRender>
                <l-agent-hub-skill-release-change-log
                  v-if="record.id"
                  :package-id="record.id"
                />
              </template>
            </a-collapse>
          </a-flex>
        </template>
      </l-agent-hub-plugin-info-card>
      <a-flex v-else justify="center" align="center" class="size-full">
        <a-empty />
      </a-flex>
    </template>
  </a-tabs>
</template>
