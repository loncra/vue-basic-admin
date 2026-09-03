<script setup lang="ts" generic="T extends PluginPackageMetadata">
import {AiUserPluginInstallService} from '@/apis'
import LIconSelect from '@/components/basic/IconSelect.vue'
import LAgentHubPluginInstall from '@/components/ai-server/agent/hub/PluginInstallModal.vue'
import type {
  PluginPackageMetadata,
  RestResult,
  TotalPage,
  UserPluginInstallResult,
} from '@/types/apis'
import {requireNonNullOrUndefined} from '@/utils'
import useApp from 'antdv-next/dist/app/useApp'
import {type ComponentInternalInstance, computed, getCurrentInstance, ref} from 'vue'
import {ICON_SELECT_AVATAR_MODE_VALUE} from "@/constants";

defineOptions({
  name: 'LAgentHubPluginInfoCard',
})

const props = withDefaults(
  defineProps<{
    dataSource: TotalPage<T>
    installs?: UserPluginInstallResult[]
    targetType: number
  }>(),
  {
    installs: () => [],
  },
)

const emits = defineEmits<{
  changePage: [page: number, pageSize: number]
  installed: [result: UserPluginInstallResult]
  uninstalled: [id: number]
}>()

const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
  getCurrentInstance(),
).appContext.config.globalProperties

const {modal, message} = useApp()
const installOpen = ref(false)
const installPackage = ref<T>()

const installByPackageId = computed(() =>
  AiUserPluginInstallService.mapInstallsByPackageId(props.installs, props.targetType),
)

function isInstalled(record: T) {
  return record.id != null && installByPackageId.value.has(record.id)
}

function onInstall(record: T) {
  if (record.id == null) {
    return
  }
  installPackage.value = record
  installOpen.value = true
}

function onUninstall(record: T) {
  const install = record.id == null ? undefined : installByPackageId.value.get(record.id)
  if (install?.id == null) {
    return
  }
  modal.confirm({
    title: globalProperties.$t('agent.hub.uninstall.confirmTitle'),
    content: globalProperties.$t('agent.hub.uninstall.confirmSingle', {name: record.name}),
    onOk: () => doUninstall(install.id as number),
  })
}

async function doUninstall(id: number) {
  const result: RestResult<void> = await AiUserPluginInstallService.uninstall(id)
  message.success(result.message)
  emits('uninstalled', id)
}

function onInstalled(result: UserPluginInstallResult) {
  emits('installed', result)
}

function onChangePage(page: number, pageSize: number) {
  emits('changePage', page, pageSize)
}
</script>

<template>
  <a-flex
    v-if="(dataSource.elements || []).length > 0"
    vertical
    class="flex-[1_1_0] overflow-y-auto"
    gap="large"
  >
    <a-card v-for="record of dataSource.elements || []" :key="record.id" size="small">
      <template #title>
        <slot name="title" :record="record" />
      </template>
      <template #extra>
        <a-button
          v-if="isInstalled(record)"
          size="small"
          danger
          type="primary"
          @click="onUninstall(record)"
        >
          <template #icon>
            <icon-font type="loncra-trash-2" />
          </template>
          {{ globalProperties.$t('agent.hub.uninstall.text') }}
        </a-button>
        <a-button v-else size="small" type="primary" @click="onInstall(record)">
          <template #icon>
            <icon-font type="loncra-download" />
          </template>
          {{ globalProperties.$t('agent.hub.install') }}
        </a-button>
      </template>
      <a-flex gap="middle" vertical class="w-full">
        <a-flex gap="middle" class="w-full">
          <l-icon-select preview :value="record.icon || ICON_SELECT_AVATAR_MODE_VALUE.INPUT + record.name" />
          <a-flex gap="small" vertical class="w-full">
            <a-flex justify="space-between" align="center">
              <a-space wrap class="flex-1">
                <a-tag :key="tag" v-for="tag of record.tags">
                  {{ tag }}
                </a-tag>
              </a-space>
              <a-typography-text type="secondary" class="text-xs">
                {{ globalProperties.$dayjs(record.creationTime).fromNow() }}
              </a-typography-text>
            </a-flex>
            <div class="max-h-30 w-full overflow-auto">
              {{ record.summary }}
            </div>
            <slot name="after" :record="record" />
          </a-flex>
        </a-flex>
      </a-flex>
    </a-card>
    <a-pagination
      size="small"
      align="center"
      :current="dataSource.number"
      hide-on-single-page
      :page-size="dataSource.size"
      :total="dataSource.totalCount"
      @change="onChangePage"
    />
  </a-flex>
  <a-flex v-else justify="center" align="center" class="size-full">
    <a-empty />
  </a-flex>
  <l-agent-hub-plugin-install
    v-model:open="installOpen"
    :target-type="targetType"
    :package-id="installPackage?.id"
    :package-name="installPackage?.name"
    @installed="onInstalled"
  />
</template>
