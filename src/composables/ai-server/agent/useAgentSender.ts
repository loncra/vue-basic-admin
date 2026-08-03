import {computed, h, onMounted, ref} from "vue";
import type {IdValueMetadata, ModelSettingEntity, RestResult} from "@/types/apis";
import LInstructionSender from "@/components/basic/chat/InstructionSender.vue";
import type {
  AgentConversationItem,
  AgentSenderFormProps,
  AgentSenderProps,
  ChatContentBlock,
  InstructionBlock
} from "@/types/composables";
import {ResourceServerService} from "@/apis";
import {ModelSettingService} from "@/apis/ai-server/modelSettingService.ts";
import {AGENT_CONVERSATION_TYPE, MODEL_TYPE} from "@/constants";
import type {SlotConfigType} from "@antdv-next/x/dist/sender/interface";
import {createIcon, getEnumValue} from "@/utils";
import {isInstructionSlot} from "@/composables/chat/useInstructionSender.ts";
import {type MenuItemType, Space} from "antdv-next";
import {useAgentChatContext} from "@/composables";

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

export function useAgentSender(
  props:AgentSenderProps
) {

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
    typeStyle:{
      "10":{
        color:'cyan',
        icon:'loncra-message-circle-question-mark',
      },
      "20":{
        color:'pink',
        icon:'loncra-clipboard-list',
      },
      "30":{
        color:'purple',
        icon:'loncra-bot',
      }
    },
    form: {
      type: 10,
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

  async function mounted() {
    await loadingData();
  }

  onMounted(mounted)

  return {
    senderRef,
    currentModel,
    workspaceOptions,
    conversationActive,
    handleSubmit,
    state,
    currentType
  }
}
