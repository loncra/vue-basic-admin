<script setup lang="ts">
import {AttachmentService} from "@/apis";
import type {CheckboxChangeEvent} from "@v-c/checkbox";
import {byteFormat, dateTimeFormat, requireNonNullOrUndefined} from "@/utils";
import LBasicImage from "@/components/basic/BasicImage.vue";
import type {ObjectItemInfo} from "@/types/apis";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {type ComponentInternalInstance, getCurrentInstance} from "vue";

defineOptions({
  name: 'LAttachmentMasonry',
})

const props =withDefaults(defineProps<{
  bucket:string
}>(),{
  bucket:'user.file'
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const configProviderStore = useConfigProviderStore();
const dataSource = defineModel<ObjectItemInfo[]>('dataSource', {default:() => []});
const checkValue = defineModel<ObjectItemInfo[]>('checkValue', {default:() => []});

function onCheckChange(id: string, checked: boolean) {
  if (checked && !checkValue.value.map(r => r.id).includes(id)) {
    const data = dataSource.value.find(r => r.id === id)
    if (data) {
      checkValue.value = [...checkValue.value, data]
    }
  } else {
    checkValue.value = checkValue.value.filter((s) => s.id !== id)
  }
}

</script>

<template>
  <a-masonry
    v-if="dataSource.length > 0"
    :columns="{ xs: 1, sm: 2, md: 3, lg: 4 }"
    :gutter="configProviderStore.getToken().sizeMD"
    :items="dataSource"
  >
    <template #itemRender="item">
      <a-card size="small">
        <template #cover>
          <l-basic-image class="w-full" v-if="(item.userMetadata?.['content-type'] || '').startsWith('image/')" :src="AttachmentService.query(props.bucket,item.objectName)"/>
          <div
            v-else
            class="aspect-[4/3] w-full flex items-center justify-center bg-fill-tertiary"
          >
            <icon-font class="icon text-3xl" type="loncra-file-text"/>
          </div>
        </template>
        <a-card-meta >
          <template #title>
            {{item.userMetadata?.['X-Amz-Meta-Original-Filename'] || item.objectName}}
          </template>
          <template #description>
            <a-flex justify="space-between" align="center">
              <a-checkbox
                :checked="checkValue.map(r => r.id).includes(item.id)"
                @change="(e:CheckboxChangeEvent) => onCheckChange(item.id, e.target.checked)"
              >
                {{byteFormat(item.size)}}
              </a-checkbox>
              <a-tooltip :title="dateTimeFormat(item.lastModified)">
                    <span>
                      {{globalProperties.$dayjs(item.lastModified).fromNow()}}
                    </span>
              </a-tooltip>
            </a-flex>
          </template>
        </a-card-meta>
      </a-card>

    </template>
  </a-masonry>
  <a-empty v-else />
</template>
