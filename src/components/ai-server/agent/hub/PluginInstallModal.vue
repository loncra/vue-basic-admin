<script setup lang="ts">
import {AiUserPluginInstallService} from '@/apis'
import {useAgentChatContext} from '@/composables'
import {AGENT_WORKSPACE_TYPE_VALUE, PLUGIN_INSTALL_WORKSPACE_SCOPE} from '@/constants'
import type {RestResult, UserPluginInstallResult} from '@/types/apis'
import {getEnumValue, requireNonNullOrUndefined} from '@/utils'
import useApp from 'antdv-next/dist/app/useApp'
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  reactive,
  ref,
  watch,
} from 'vue'

defineOptions({
  name: 'LAgentHubPluginInstall',
})

const props = defineProps<{
  open: boolean
  targetType: number
  packageId?: number
  packageName?: string
}>()

const emits = defineEmits<{
  'update:open': [open: boolean]
  installed: [result: UserPluginInstallResult]
}>()

const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
  getCurrentInstance(),
).appContext.config.globalProperties

const {message} = useApp()
const {conversations} = useAgentChatContext()
const formRef = ref()
const spinning = ref(false)

const form = reactive({
  workspaceScope: PLUGIN_INSTALL_WORKSPACE_SCOPE.USER as number,
  agentConversationIds: [] as number[],
})

const workspaceOptions = computed(() =>
  conversations.value
    .filter(
      (item) =>
        item.id != null && AGENT_WORKSPACE_TYPE_VALUE.includes(getEnumValue(item.type)),
    )
    .map((item) => ({
      label: item.name,
      value: item.id as number,
    })),
)

const workspaceScopeOptions = computed(() => [
  {
    value: PLUGIN_INSTALL_WORKSPACE_SCOPE.USER,
    label: globalProperties.$t('agent.hub.workspaceScope.all'),
  },
  {
    value: PLUGIN_INSTALL_WORKSPACE_SCOPE.ORG,
    label: globalProperties.$t('agent.hub.workspaceScope.specific'),
  },
])

watch(
  () => props.open,
  (open) => {
    if (!open) {
      return
    }
    form.workspaceScope = PLUGIN_INSTALL_WORKSPACE_SCOPE.USER
    form.agentConversationIds = []
  },
)

function close() {
  emits('update:open', false)
}

async function validateWorkspaces() {
  if (form.workspaceScope !== PLUGIN_INSTALL_WORKSPACE_SCOPE.ORG) {
    return Promise.resolve()
  }
  if (form.agentConversationIds.length > 0) {
    return Promise.resolve()
  }
  return Promise.reject(globalProperties.$t('agent.hub.workspace.required'))
}

async function onOk() {
  await formRef.value?.validate()
  if (props.packageId == null) {
    return Promise.reject()
  }
  spinning.value = true
  try {
    const result: RestResult<UserPluginInstallResult> = await AiUserPluginInstallService.install({
      targetType: props.targetType,
      packageId: props.packageId,
      workspaceScope: form.workspaceScope,
      agentConversationIds:
        form.workspaceScope === PLUGIN_INSTALL_WORKSPACE_SCOPE.ORG
          ? form.agentConversationIds
          : undefined,
    })
    message.success(result.message)
    if (result.data) {
      emits('installed', result.data)
    }
    close()
  } finally {
    spinning.value = false
  }
}
</script>

<template>
  <a-modal
    :open="open"
    :title="globalProperties.$t('agent.hub.installTitle', {name: packageName})"
    :ok-text="globalProperties.$t('agent.hub.install')"
    :confirm-loading="spinning"
    :mask-closable="false"
    destroy-on-hidden
    @ok="onOk"
    @cancel="close"
  >
    <a-form ref="formRef" :model="form" layout="vertical">
      <a-form-item
        name="workspaceScope"
        :label="globalProperties.$t('agent.hub.workspaceScope.text')"
        :rules="[{required: true}]"
      >
        <a-radio-group v-model:value="form.workspaceScope" :options="workspaceScopeOptions" />
      </a-form-item>
      <a-form-item
        v-if="form.workspaceScope === PLUGIN_INSTALL_WORKSPACE_SCOPE.ORG"
        name="agentConversationIds"
        :label="globalProperties.$t('agent.workspace.title')"
        :rules="[{validator: validateWorkspaces, trigger: 'change'}]"
      >
        <a-checkbox-group
          v-if="workspaceOptions.length > 0"
          v-model:value="form.agentConversationIds"
          class="gap-sm"
          :options="workspaceOptions"
        />
        <a-empty v-else :description="globalProperties.$t('agent.hub.workspace.empty')" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
