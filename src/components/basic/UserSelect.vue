<script setup lang="ts">

import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref, useSlots} from "vue";
import type {
  EnumBucketsResponseBody,
  IdNameValueMetadata,
  NameValueEnumMetadata,
  PageRequest,
  PlatformUser,
  RestResult
} from "@/types/apis";
import {AuthServerService, ResourceServerService} from "@/apis";
import type {DefaultOptionType} from '@v-c/select'
import {requireNonNullOrUndefined} from "@/utils";

defineOptions({
  name: 'LUserSelect',
})

const props = withDefaults(defineProps<{
  ignoreTypes?:string[],
  valueField?:keyof PlatformUser,
  compactButton?:boolean,
  query?:Record<string, string>,
  mode?: 'multiple' | 'tags'
}>(),{
  compactButton:true,
  mode: 'multiple'
})

const slots = useSlots();
const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const userTypeOptions = ref<DefaultOptionType[]>([])

const loading = ref(false);
const emits = defineEmits<{
  change:[value:string, option:Record<string,unknown>]
}>()

const options = ref<DefaultOptionType[]>([])
const currentIgnoreTypes = ref<string[]>([])
const modelValue = defineModel<string | string[]>('value',{ default: () => [] });

async function searchUser(value:string){
  let searchData:DefaultOptionType[] = []
  if (value !== "") {
    const param:PageRequest = {
      ...props.query || {},
      size:10,
      number:1,
      ignoreTypes: currentIgnoreTypes.value,
      idNameValueMetadata:true
    }
    param['filter_[real_name_like]_or_[phone_number_eq]_or_[email_eq]_or_[id_eq]'] = value;
    const result:RestResult<IdNameValueMetadata<PlatformUser[]>[]> = await AuthServerService.systemUsers(param)
    searchData = (result.data || []).map(d => ({
      label: d.name,
      value: d.id,
      options:d.value.map(d => ({
        label: d.realName || d.username,
        value: d.systemName,
        payload:d
      }))
    }))
  }

  options.value = [...userTypeOptions.value, ...searchData];
}

function onDeselect(value:string) {
  const userTypeOption = userTypeOptions.value.find(t => t.value === value)
  if (userTypeOption && currentIgnoreTypes.value.includes(userTypeOption.type)) {
    currentIgnoreTypes.value = currentIgnoreTypes.value.filter(v => v !== userTypeOption.type);
    searchUser(value);
  }
}

function onSelect(value:string) {
  const userTypeOption = userTypeOptions.value.find(t => t.value === value)
  if (userTypeOption && !currentIgnoreTypes.value.includes(userTypeOption.type)) {
    currentIgnoreTypes.value.push(userTypeOption.type)
    options.value = options.value.filter(v => !currentIgnoreTypes.value.includes(String(v.value)));
  }
}

async function mounted(){
  const enums:RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({"resource-server":[{"id":"ResourceSourceEnum"}]})
  if (enums.data) {
    const userTypeOptionsData =  enums.data['resource-server']?.ResourceSourceEnum as NameValueEnumMetadata<string>[]
    userTypeOptions.value = userTypeOptionsData.map(v => ({
      label:globalProperties.$t('common.all', {name:' ' + v.name}),
      type: v.value,
      value:"ALL_" + String(v.value)
    }))
  }
  currentIgnoreTypes.value = [...props.ignoreTypes || []]
}

onMounted(mounted)
</script>

<template>
  <a-select class="w-full"
    :filter-option="false"
    max-tag-count="responsive"
    :not-found-content="loading ? undefined : null"
    v-bind="$attrs"
    :mode="props.mode"
    show-search
    @select="onSelect"
    @deselect="onDeselect"
    v-model:value="modelValue"
    @search="searchUser"
    @change="(value:string,option:Record<string,unknown>) => emits('change', value, option)"
    :options="options"
  >
    <template #optionRender="{ option }">
      <slot v-if="slots.optionRender" name="optionRender" :option="option" />
      <template v-else>
        {{ option.data?.payload?.realName || option.data?.payload?.username || option.data.label}}
      </template>
    </template>
    <template #popupRender="menu" v-if="slots.popupRender">
      <slot name="popupRender" :menu="menu" />
    </template>
    <template v-if="slots.labelRender" #labelRender="slotProps">
      <slot name="labelRender" v-bind="slotProps" />
    </template>
    <template v-if="slots.tagRender" #tagRender="slotProps">
      <slot name="tagRender" v-bind="slotProps" />
    </template>
  </a-select>
</template>
