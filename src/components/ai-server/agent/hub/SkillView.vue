<script setup lang="ts">
import {AiSkillPackageService, AiUserPluginInstallService, ResourceServerService} from '@/apis'
import {type ComponentInternalInstance, computed, getCurrentInstance, onMounted, ref} from 'vue'
import type {
  DataDictionaryMetadata,
  PageRequest,
  RestResult,
  SkillPackageEntity,
  TotalPage,
  UserPluginInstallResult,
} from '@/types/apis'
import {
  DATA_DICTIONARY_ALL_CODE,
  DATA_STATUS,
  DEFAULT_PAGE_RESULT_VALUE,
  ICON_SELECT_MODE,
  PACKAGE_TYPE,
  PLUGIN_TARGET_TYPE,
  SKILL_GROUP_CODE_PREFIX,
} from '@/constants'
import {addAllDataDictionary, requireNonNullOrUndefined} from '@/utils'
import LIconSelect from '@/components/basic/IconSelect.vue'
import LAgentHubPluginInstall from '@/components/ai-server/agent/hub/PluginInstallModal.vue'
import useApp from 'antdv-next/dist/app/useApp'

defineOptions({
  name: 'LAgentHubSkill',
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

const {modal, message} = useApp()
const service = new AiSkillPackageService()

const loading = ref<boolean>(false)

const dataSource = ref<TotalPage<SkillPackageEntity>>({
  ...DEFAULT_PAGE_RESULT_VALUE,
  totalCount: 0,
  totalPages: 0,
})

const groups = ref<DataDictionaryMetadata[]>([])
const activeGroupCode = ref<string>()
const installOpen = ref(false)
const installPackage = ref<SkillPackageEntity>()

const installByPackageId = computed(() =>
  AiUserPluginInstallService.mapInstallsByPackageId(props.installs, PLUGIN_TARGET_TYPE.SKILL),
)

function isInstalled(record: SkillPackageEntity) {
  return record.id != null && installByPackageId.value.has(record.id)
}

function onTabChange(key: string) {
  activeGroupCode.value = key
  loadData({number: 1, size: 10})
}

function onChangePage(page: number, pageSize: number) {
  loadData({
    number: page,
    size: pageSize,
  })
}

function onInstall(record: SkillPackageEntity) {
  if (record.id == null) {
    return
  }
  installPackage.value = record
  installOpen.value = true
}

function onUninstall(record: SkillPackageEntity) {
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

async function loadData(request: PageRequest) {
  loading.value = true
  try {
    const param: PageRequest = {
      ...request,
      'filter_[status_eq]': DATA_STATUS.RELEASE,
      'filter_[type_eq]': PACKAGE_TYPE.HUB,
    }

    if (activeGroupCode.value !== DATA_DICTIONARY_ALL_CODE) {
      param['filter_[category.code_jeq]'] = activeGroupCode.value
    }
    const result: RestResult<TotalPage<SkillPackageEntity>> = await service.page(param)

    if (result.data) {
      dataSource.value = result.data
    }
  } finally {
    loading.value = false
  }
}

async function mounted() {
  const result: RestResult<Record<string, DataDictionaryMetadata[]>> =
    await ResourceServerService.findDataDictionariesByCodes([SKILL_GROUP_CODE_PREFIX])
  if (!result.data) {
    return
  }
  groups.value = addAllDataDictionary(result.data[SKILL_GROUP_CODE_PREFIX] || [])
  const first = groups.value.at(0)
  if (first) {
    onTabChange(first.code)
  }
}

onMounted(mounted)
</script>

<template>
  <a-tabs
    @change="onTabChange"
    tab-placement="left"
    :classes="{
        root: 'min-h-0 h-full',
        body: 'min-h-0 h-full overflow-hidden',
        content: 'min-h-0 h-full ',
      }"
    :items="groups.map(g => ({label:g.name, key:g.code,value:g.value, metadata:g.metadata}))"
  >
    <template #contentRender>
      <a-spin :spinning="loading" class="size-full-spin">
        <a-flex vertical class="flex-[1_1_0] overflow-y-auto" gap="large" v-if="(dataSource.elements || []).length > 0">
          <a-card :key="record.id" v-for="record of dataSource.elements || []" :title="record.name + ' ' + record.latestVersion"
                  size="small">
            <template #extra>
              <a-button
                v-if="isInstalled(record)"
                size="small"
                danger
                type="primary"
                @click="onUninstall(record)"
              >
                <template #icon>
                  <icon-font type="loncra-trash-2"/>
                </template>
                {{ globalProperties.$t('agent.hub.uninstall.text') }}
              </a-button>
              <a-button v-else size="small" type="primary" @click="onInstall(record)">
                <template #icon>
                  <icon-font type="loncra-download"/>
                </template>
                {{ globalProperties.$t('agent.hub.install') }}
              </a-button>
            </template>
            <a-flex gap="middle" vertical class="w-full">
              <a-flex gap="middle" class="w-full">
                <l-icon-select :mode="ICON_SELECT_MODE.AVATAR" preview v-model:value="record.icon"/>
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
                </a-flex>
              </a-flex>
            </a-flex>
          </a-card>
          <a-pagination
            size="small"
            align="center"
            :current="dataSource.number"
            hide-on-single-page
            :pageSize="dataSource.size"
            :total="dataSource.totalCount"
            @change="onChangePage"
          />
        </a-flex>
        <a-flex v-else justify="center" align="center" class="size-full">
          <a-empty />
        </a-flex>
      </a-spin>
    </template>
  </a-tabs>
  <l-agent-hub-plugin-install
    v-model:open="installOpen"
    :target-type="PLUGIN_TARGET_TYPE.SKILL"
    :package-id="installPackage?.id"
    :package-name="installPackage?.name"
    @installed="onInstalled"
  />
</template>
