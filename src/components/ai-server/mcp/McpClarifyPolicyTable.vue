<script setup lang="ts">

import {type ComponentInternalInstance, computed, getCurrentInstance, ref} from "vue";
import {getEnumValue, requireNonNullOrUndefined} from "@/utils";
import type {
  McpClarifyToolPolicyMetadata,
  McpClientTransportMetadata,
  McpToolMetadata,
  RestResult
} from "@/types/apis";
import LTooltipValidationFormItem from "@/components/basic/TooltipValidationFormItem.vue";
import {YES_OR_NO_TYPE} from "@/constants";
import {AiMcpPackageService} from "@/apis";
import type {ColumnType} from "antdv-next/dist/table/interface";

defineOptions({
  name: 'LMcpClarifyPolicyTable',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const props = withDefaults(defineProps<{
  formItemNamePrefix: string[]
  edit?:boolean
  mcpClient:McpClientTransportMetadata
}>(),{
  edit:true,
  formItemNamePrefix: () => []
})

const clarifyPolicyColumns = computed<ColumnType<McpClarifyToolPolicyMetadata>[]>(() => {
  const result = [
    {
      title: globalProperties.$t('aiServer.mcpPackage.toolName'),
      dataIndex: 'toolName',
      key: 'toolName',
      ellipsis: true,
      width: 180,
    },
    {
      title: globalProperties.$t('aiServer.mcpPackage.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: globalProperties.$t('aiServer.mcpPackage.maxClarifyRounds'),
      dataIndex: 'maxClarifyRounds',
      key: 'maxClarifyRounds',
      width: 120,
    }
  ]

  if (props.edit) {
    result.push({
      title: globalProperties.$t('common.action'),
      dataIndex: 'action',
      key: 'action',
      align: 'center',
      fixed: 'right',
      width: 100,
    })
  }

  return result;
})

const loading = ref<boolean>(false);

const model = defineModel<McpClarifyToolPolicyMetadata[]>("value",{default:() => []})

const service = new AiMcpPackageService()

async function loadTools() {
  loading.value = true;
  try {
    const tools:RestResult<McpToolMetadata[]> = await service.listTools(props.mcpClient);
    if (!tools.data) {
      return ;
    }

    for (const tool of tools.data) {
      const find = model.value.find(item => item.toolName === tool.name)
      if (find) {
        find.description = tool.description
        find.annotation = tool.annotation
      } else{
        model.value.push({
          toolName: tool.name,
          description: tool.description,
          maxClarifyRounds: 3,
          enabled: {
            name:'否',
            value:YES_OR_NO_TYPE.NO
          },
          annotation: tool.annotation,
        })
      }
    }
    const names = tools.data.map(s => s.name);
    model.value = model.value.filter(item => names.includes(item.toolName))
  } finally {
    loading.value = false;
  }
}

function clarifyPolicyRowClassName(record: McpClarifyToolPolicyMetadata) {
  return getEnumValue(record.enabled) === YES_OR_NO_TYPE.NO
    ? '[&_td:not(.ant-table-cell-fix-right)]:line-through [&_td:not(.ant-table-cell-fix-right)]:opacity-65'
    : ''
}

</script>

<template>
  <a-table
    :row-class-name="clarifyPolicyRowClassName"
    :pagination="false"
    bordered
    :scroll="{ y: 275 }"
    :data-source="model"
    :loading="loading"
    row-key="toolName"
    :columns="clarifyPolicyColumns"
  >
    <template #title>
      <a-flex justify="space-between" align="center">
        <a-space>
          <icon-font class="icon align" type="loncra-tower-control" />
          {{globalProperties.$t('aiServer.mcpPackage.clarifyTools')}}
        </a-space>
        <a-button @click="loadTools" v-if="props.edit">
          <template #icon>
            <icon-font class="icon" type="loncra-refresh-cw" />
          </template>
        </a-button>
      </a-flex>
    </template>
    <template #bodyCell="{index, column, record}">
      <template v-if="column.dataIndex === 'toolName'">
        {{ record.toolName }}
      </template>
      <template v-if="column.dataIndex === 'description'">
        {{ record.description || '' }}
      </template>
      <template v-if="column.dataIndex === 'maxClarifyRounds'">
        <a-form-item
          no-style
          has-feedback
          v-if="getEnumValue(record.enabled) && props.edit"
          :message-variables="{ label: column.title }"
          class="m-0"
          :name="[...props.formItemNamePrefix, index, column.dataIndex]"
        >
          <l-tooltip-validation-form-item>
            <a-input-number
              class="w-full"
              :min="1"
              v-model:value="record.maxClarifyRounds"
            />
          </l-tooltip-validation-form-item>
        </a-form-item>
        <template v-else>
          {{record.maxClarifyRounds}}
        </template>
      </template>
      <template v-if="column.dataIndex === 'action'">
        <a-button :danger="getEnumValue(record.enabled) === YES_OR_NO_TYPE.YES" @click="() => record.enabled.value = getEnumValue(record.enabled) ? YES_OR_NO_TYPE.NO : YES_OR_NO_TYPE.YES" >
          <template #icon>
            <icon-font class="icon" :type="getEnumValue(record.enabled) ? 'loncra-circle-x' : 'loncra-circle-check'" />
          </template>
          {{getEnumValue(record.enabled) ? $t('common.disabled') : $t('common.enabled')}}
        </a-button>
      </template>
    </template>
  </a-table>
</template>

<style scoped>

</style>
