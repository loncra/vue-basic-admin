<script setup lang="ts">
import {type ComponentInternalInstance, computed, getCurrentInstance} from "vue";
import {requireNonNullOrUndefined} from "@/utils";
import type {KeyValueRow} from "@/types/composables";
import LTooltipValidationFormItem from "@/components/basic/TooltipValidationFormItem.vue";
import type {ColumnType} from "antdv-next/dist/table/interface";

defineOptions({
  name: 'LKeyValueTable',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const props = withDefaults(defineProps<{
  formItemNamePrefix?: string[]
  title?: string
  multipleValue?: boolean
  edit?: boolean
  icon?: string
}>(), {
  formItemNamePrefix: () => [],
  multipleValue: false,
  edit: true
})

const emits = defineEmits<{
  change: [item: KeyValueRow, data: KeyValueRow[]],
}>()

const model = defineModel<KeyValueRow[]>("value", {default: () => []})

const keyValueColumns = computed<ColumnType<KeyValueRow>[]>(() => {
  const result:ColumnType<KeyValueRow>[] = [{
    title: globalProperties.$t('common.name'),
    dataIndex: 'key',
    key: 'key',
    width: 120,
  },
    {
      title: globalProperties.$t('common.value'),
      dataIndex: 'value',
      key: 'value'
    }]
  if (props.edit) {
    result.push(
      {
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

function addKeyValueRow() {
  model.value.push({id: crypto.randomUUID(), key: '', value: '', editing: true})
}

function removeKeyValueRow(record: KeyValueRow) {
  model.value = model.value.filter(row => row.id !== record.id)
  emits("change", record, model.value)
}

function editKeyValueRow(record: KeyValueRow) {
  record.editing = true
  record.origin = {...record};
}

function confirmKeyValueRow(record: KeyValueRow) {
  record.editing = false
  delete record.origin
  emits("change", record, model.value)
}

function cancelKeyValueRow(record: KeyValueRow) {
  if (record.origin) {
    // 把原值写回原对象本身，而不是新建一个对象替换局部变量
    record.key = record.origin.key
    record.value = record.origin.value
    delete record.origin
  }
  record.editing = false
  emits("change", record, model.value)
}

function confirmAllEditingRows() {
  for (const row of model.value) {
    if (row.editing) {
      confirmKeyValueRow(row)
    }
  }
}

defineExpose({confirmAllEditingRows})

</script>

<template>
  <a-table
    :pagination="false"
    bordered
    :scroll="{ y: 275 }"
    :data-source="model"
    :columns="keyValueColumns"
    row-key="id"
  >
    <template #title v-if="props.title">
      <a-flex justify="space-between" align="center">
        <a-space>
          <icon-font v-if="props.icon" class="icon align" :type="props.icon"/>
          {{ props.title }}
        </a-space>
        <a-button @click="addKeyValueRow()" v-if="props.edit">
          <template #icon>
            <icon-font type="loncra-plus"/>
          </template>
        </a-button>
      </a-flex>
    </template>
    <template #bodyCell="{index, column, record}">
      <template v-if="column.dataIndex === 'key'">
        <a-form-item
          no-style
          :rules="[{required: true}]"
          :name="[...props.formItemNamePrefix, index, column.key]" v-if="record.editing"
          has-feedback
          :message-variables="{ label: column.title }"
        >
          <l-tooltip-validation-form-item>
            <a-input v-model:value="record.key"/>
          </l-tooltip-validation-form-item>
        </a-form-item>
        <template v-else>
          {{ record.key }}
        </template>
      </template>
      <template v-if="column.dataIndex === 'value'">
        <a-form-item
          no-style
          :rules="[{required: true}]"
          :name="[...props.formItemNamePrefix, index, column.key]"
          v-if="record.editing"
          :message-variables="{ label: column.title }"
          has-feedback
        >
          <l-tooltip-validation-form-item>
            <a-select
              v-if="multipleValue"
              v-model:value="record.value as string[]"
              mode="tags"
              class="w-full"
              max-tag-count="responsive"
            />
            <a-input v-else v-model:value="record.value"/>
          </l-tooltip-validation-form-item>
        </a-form-item>
        <template v-else>
          {{ Array.isArray(record.value) ? record.value.join(', ') : record.value }}
        </template>
      </template>
      <template v-if="column.dataIndex === 'action'">
        <a-space-compact v-if="record.editing">
          <a-button @click="confirmKeyValueRow(record)" type="primary">
            <template #icon>
              <icon-font type="loncra-check"/>
            </template>
          </a-button>
          <a-button @click="cancelKeyValueRow(record)" type="primary" danger>
            <template #icon>
              <icon-font type="loncra-x"/>
            </template>
          </a-button>
        </a-space-compact>
        <a-space-compact v-else>
          <a-button @click="editKeyValueRow(record)" type="primary">
            <template #icon>
              <icon-font type="loncra-file-pen-line"/>
            </template>
          </a-button>
          <a-button @click="removeKeyValueRow(record)" type="primary" danger>
            <template #icon>
              <icon-font type="loncra-archive-x"/>
            </template>
          </a-button>
        </a-space-compact>
      </template>
    </template>
  </a-table>
</template>
