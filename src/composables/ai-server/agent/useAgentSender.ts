import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  h,
  onMounted,
  ref,
  watch
} from "vue";
import type {IdValueMetadata, ModelSettingEntity, RestResult} from "@/types/apis";
import LInstructionSender from "@/components/basic/chat/InstructionSender.vue";
import type {
  AgentConversationItem,
  AgentSenderFormProps,
  AgentSenderProps,
  ChatContentBlock,
  InstructionBlock,
  InstructionMeasure,
} from "@/types/composables";
import {ResourceServerService} from "@/apis";
import {ModelSettingService} from "@/apis/ai-server/modelSettingService.ts";
import {
  AGENT_CHAT_TYPE_STYLE,
  AGENT_CONVERSATION_TYPE,
  AGENT_INSTRUCTION_PREFIX,
  MODEL_TYPE,
  PLUGIN_INSTALL_STATUS,
  PLUGIN_INSTALL_WORKSPACE_SCOPE,
  PLUGIN_TARGET_TYPE,
} from "@/constants";
import type {SlotConfigType} from "@antdv-next/x/dist/sender/interface";
import {createIcon, createInstructionSlot, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {isInstructionSlot} from "@/composables/chat/useInstructionSender.ts";
import {type MenuItemType, Space} from "antdv-next";
import {getConversationRuns, useAgentChatContext} from "@/composables";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import type {MenuInfo} from "@v-c/menu";

const modelSettingService = new ModelSettingService()

function toModelMenuItems(models: ModelSettingEntity[]): MenuItemType[] {
  const groups = new Map<string, {
    label: string,
    metadata?: Record<string, unknown>,
    children: NonNullable<MenuItemType[]>
  }>()
  for (const item of models) {
    const code = item.manufacturer?.code || 'unknown'
    const label = item.manufacturer?.name || '未分组'
    let group = groups.get(code)
    if (!group) {
      group = { label, children: [] ,metadata:item.manufacturer.metadata}
      groups.set(code, group)
    }
    group.children.push({
      key: String(item.id),
      label: item.name,
      icon: () => createIcon(item.icon || 'loncra-sticker'),
    })
  }
  return Array.from(groups.entries()).map(([code, group]) => ({
    type: 'group' as const,
    key: code,
    label: h(Space, {}, () => [
      createIcon(String(group?.metadata?.icon || 'loncra-building'), 'align'),
      h('span', {}, group.label),
    ]),
    children: group.children,
  }))
}

export function toCatalogMenuItems(items: IdValueMetadata<string, string>[]): MenuItemType[] {
  const groups = new Map<string, {
    label: string,
    icon: string,
    children: NonNullable<MenuItemType[]>
  }>()
  for (const item of items) {
    const group = String(item.metadata?.group ?? '')
    if (!group) {
      continue
    }
    let bucket = groups.get(group)
    if (!bucket) {
      bucket = {
        label: String(item.metadata?.groupLabel ?? group),
        icon: group === 'mcp' ? 'loncra-plug-zap' : 'loncra-sparkles',
        children: [],
      }
      groups.set(group, bucket)
    }
    bucket.children.push({
      key: group + ':' + item.id,
      label: item.value,
      icon: () => createIcon(String(item.metadata?.icon || bucket.icon)),
    })
  }
  return Array.from(groups.entries()).map(([key, group]) => ({
    type: 'group' as const,
    key,
    label: h(Space, {}, () => [
      createIcon(group.icon, 'align'),
      h('span', {}, group.label),
    ]),
    children: group.children,
  }))
}

export function useAgentSender(
  props:AgentSenderProps
) {

  const currentInstance = requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance())
  const globalProperties = currentInstance.appContext.config.globalProperties
  const configProviderStore = useConfigProviderStore()
  const principalStore = usePrincipalStore()
  const {conversationActive, conversations} = useAgentChatContext()

  const senderRef = ref<InstanceType<typeof LInstructionSender>>()

  const state = ref<{
    typeOptions:MenuItemType[],
    loading: boolean,
    modelOptions:MenuItemType[]
    typeStyle:Record<string, { color:string, icon:string, data?:IdValueMetadata<number,string> }>,
    form:AgentSenderFormProps
  }>({
    typeOptions:[],
    loading: false,
    modelOptions:[],
    typeStyle:AGENT_CHAT_TYPE_STYLE,
    form: {
      type: 30,
      content: []
    }
  })

  const models = ref<ModelSettingEntity[]>([])
  const types = ref<IdValueMetadata<number,string>[]>([])

  async function loadingData() {

    state.value.loading = true
    try {
      const enumerate:RestResult<IdValueMetadata<number,string>[]> = await ResourceServerService.getServiceEnumerate('ai-server', 'AgentChatTypeEnum')
      types.value = enumerate.data || []
      state.value.typeOptions = types.value.map(t => ({
        key:String(t.id),
        label: t.value,
        icon:() => createIcon(getTypeStyle(Number(t.id)).icon)})
      );
      const model:RestResult<ModelSettingEntity[]> = await modelSettingService.findEnabled({'filter_[type_eq]':MODEL_TYPE.CHAT})
      models.value = model.data || [];
      state.value.modelOptions = toModelMenuItems(models.value);
      if (models.value.length > 0) {
        state.value.form.modelId = models?.value[0]?.id
      }
    } finally {
      state.value.loading = false
    }
  }

  async function handleSubmit(
    value: string,
    _slotConfig?: SlotConfigType[]
  ): Promise<void> {
    if (!_slotConfig?.length) {
      return
    }
    state.value.loading = true
    try {
      const blocks: ChatContentBlock[] = []

      for (const slot of _slotConfig) {
        if (isInstructionSlot(slot) && slot.key) {
          const instructionBlock: InstructionBlock = {
            id:slot.key,
            value: {id:slot.props.defaultValue.id, value:slot.props.defaultValue.value},
            type: 'custom',
            prefix: slot.props.prefix,
            slotKind: 'instruction',
          }
          blocks.push(instructionBlock)
        } else {
          blocks.push(slot as ChatContentBlock)
        }
      }
      props.onSubmit({...state.value.form, ...{content:blocks}})
    } finally {
      state.value.loading = false
    }
  }

  function handleCancel() {
    props.onCancel()
  }

  const currentModel = computed(() => models.value.find(m => m.id === state.value.form.modelId))

  function getTypeStyle(type:number) {
    const key = String(type);
    const result = state.value.typeStyle[key]
    if (!result) {
      return {
        color:'default',
        icon:'loncra-file-exclamation-point',
      }
    } else {
      result.data = types.value.find(f => f.id === type)
    }
    return result
  }

  const currentType = computed(() => {
    return getTypeStyle(Number(state.value.form.type))
  })

  const workspaceOptions = computed(() => {
    if (!conversationActive.value) {
      return
    }
    let workspaces:AgentConversationItem | undefined
    if (getEnumValue(conversationActive.value.type) === AGENT_CONVERSATION_TYPE.WORKSPACE_CONVERSATION) {
      workspaces = conversations.value.find(s => s.id === conversationActive.value?.parentId)
    } else {
      workspaces = conversationActive.value as AgentConversationItem
    }
    if (!workspaces) {
      return
    }

    return {
      variant: "outlined",
      color: getEnumValue(workspaces.type) === AGENT_CONVERSATION_TYPE.DEFAULT_WORKSPACE ? 'blue' : 'green',
      label: workspaces.name,
      icon:() => createIcon(workspaces.type === AGENT_CONVERSATION_TYPE.DEFAULT_WORKSPACE ? 'loncra-folder-cog' : 'loncra-folder-closed'),
    }
  })

  function currentWorkspaceId(): number | undefined {
    if (!conversationActive.value) {
      return undefined
    }
    if (getEnumValue(conversationActive.value.type) === AGENT_CONVERSATION_TYPE.WORKSPACE_CONVERSATION) {
      return conversationActive.value.parentId
    }
    return conversationActive.value.id
  }

  const catalogItems = computed(() => {
    const workspaceId = currentWorkspaceId()
    const items: IdValueMetadata<string, string>[] = []
    for (const item of principalStore.pluginInstalls) {
      if (getEnumValue(item.status) !== PLUGIN_INSTALL_STATUS.ACTIVATED) {
        continue
      }
      if (!item.pluginPackage || item.packageId == null) {
        continue
      }
      const scope = getEnumValue(item.workspaceScope)
      if (scope === PLUGIN_INSTALL_WORKSPACE_SCOPE.ORG) {
        if (workspaceId == null) {
          continue
        }
        if (!item.workspaces?.some((workspace) => String(workspace.id) === String(workspaceId))) {
          continue
        }
      }
      const targetType = getEnumValue(item.targetType)
      const isMcp = targetType === PLUGIN_TARGET_TYPE.MCP
      const isSkill = targetType === PLUGIN_TARGET_TYPE.SKILL
      if (!isMcp && !isSkill) {
        continue
      }
      items.push({
        id: String(item.packageId),
        value: item.pluginPackage.name,
        metadata: {
          trigger: AGENT_INSTRUCTION_PREFIX.TRIGGER,
          group: isMcp ? 'mcp' : 'skill',
          groupLabel: isMcp
            ? globalProperties.$t('agent.hub.mcp')
            : globalProperties.$t('agent.hub.skill'),
          slotPrefix: isMcp ? AGENT_INSTRUCTION_PREFIX.MCP : AGENT_INSTRUCTION_PREFIX.SKILL,
          icon: item.pluginPackage.icon,
        },
      })
    }
    return items
  })

  const instructionMap = computed(() => ({
    [AGENT_INSTRUCTION_PREFIX.TRIGGER]: catalogItems.value.filter(
      (item) => item.metadata?.trigger === AGENT_INSTRUCTION_PREFIX.TRIGGER,
    ),
  }))

  const plusMenuItems = computed(() => toCatalogMenuItems(catalogItems.value))

  function filterInstruction(
    keyword: string,
    dataSource: IdValueMetadata<string, string>[],
  ): IdValueMetadata<string, string>[] {
    const query = keyword.trim().toLowerCase()
    if (!query) {
      return dataSource
    }
    return dataSource.filter((item) => item.value.toLowerCase().includes(query))
  }

  function findCatalogItem(key: string | number): IdValueMetadata<string, string> | undefined {
    const raw = String(key)
    const separator = raw.indexOf(':')
    if (separator < 0) {
      return undefined
    }
    const group = raw.slice(0, separator)
    const id = raw.slice(separator + 1)
    return catalogItems.value.find(
      (item) => item.metadata?.group === group && item.id === id,
    )
  }

  function insertCatalogItem(
    option: IdValueMetadata<string, string>,
    measure?: InstructionMeasure,
  ): void {
    const sender = senderRef.value?.getSender()
    if (!sender) {
      return
    }
    const slotPrefix = String(option.metadata?.slotPrefix ?? measure?.prefix ?? '')
    if (!slotPrefix) {
      return
    }
    const block = createInstructionSlot(
      {
        id: crypto.randomUUID(),
        type: 'custom',
        slotKind: 'instruction',
        value: {id: option.id, value: option.value},
        prefix: slotPrefix,
      },
      configProviderStore,
      currentInstance,
    )
    if (measure) {
      sender.insert(
        [block, {type: 'text', value: ' '}],
        'cursor',
        measure.prefix + measure.keyword,
      )
      return
    }
    sender.insert([block, {type: 'text', value: ' '}], 'cursor')
  }

  function onPlusMenuClick(info: MenuInfo): void {
    const option = findCatalogItem(info.key)
    if (!option) {
      return
    }
    insertCatalogItem(option)
  }

  async function mounted() {
    await loadingData()
    onChangeConversation()
  }

  function onChangeConversation() {
    if (!conversationActive.value) {
      state.value.form.modelId = undefined
      state.value.form.type = 30
      return
    }
    if (conversationActive.value.lastModel) {
      state.value.form.modelId = conversationActive.value.lastModel.id;
    }
    if (conversationActive.value.lastChatType) {
      state.value.form.type = getEnumValue(conversationActive.value.lastChatType);
    }
  }

  const isRunning = computed(() =>  {
    if (state.value.loading) {
      return true
    }
    if (!conversationActive || !conversationActive.value) {
      return false
    }
    const active = conversationActive.value
    if (active.loading) {
      return true;
    }
    if (getConversationRuns(active).length > 0) {
      return true;
    }
    return false
  })

  watch(conversationActive,onChangeConversation,{immediate:true})

  onMounted(mounted)

  return {
    senderRef,
    currentModel,
    workspaceOptions,
    conversationActive,
    handleSubmit,
    handleCancel,
    state,
    isRunning,
    currentType,
    catalogItems,
    instructionMap,
    plusMenuItems,
    toCatalogMenuItems,
    filterInstruction,
    findCatalogItem,
    insertCatalogItem,
    onPlusMenuClick,
  }
}
