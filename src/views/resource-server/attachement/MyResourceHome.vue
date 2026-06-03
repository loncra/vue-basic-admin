<script setup lang="ts">

import {AttachmentService} from "@/apis/resource-server/attachmentService.ts";
import {byteFormat, createIcon, dateTimeFormat, requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, computed, getCurrentInstance, onMounted, ref} from "vue";
import type {ObjectItemInfo, RestResult} from "@/types/apis";
import type {ResolvedAction} from "@/types/composables";
import useApp from "antdv-next/dist/app/useApp";
import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import {MyResourceService} from "@/apis/resource-server/myResourceService.ts";
import LBasicImage from "@/components/basic/BasicImage.vue";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import LActionButton from "@/components/basic/ActionButton.vue";
import type {CheckboxChangeEvent} from '@v-c/checkbox'

defineOptions({
  name: 'CommonUserExport',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const configProviderStore = useConfigProviderStore();

const service = new MyResourceService();
const dataSource = ref<ObjectItemInfo[]>([]);
const checkValue = ref<ObjectItemInfo[]>([]);

const loading = ref<boolean>(false);

const {message, modal} = useApp()

const actions = computed<ResolvedAction[]>(() => {
  const count = checkValue.value.length
  const disabled = count === 0
  return [
    {
      id: 'downloadSelected',
      label: globalProperties.$t('common.download.selected', { count }),
      icon: createIcon('loncra-download', 'align'),
      disabled,
      run: disabled
        ? undefined
        : () =>
          AttachmentService.downloads(
            checkValue.value.map((k) => ({
              bucketName: 'user.file',
              objectName: k.objectName,
            })),
          ),
    },
    {
      id: 'deleteSelected',
      label: globalProperties.$t('common.delete.selected', { count }),
      icon: createIcon('loncra-archive-x', 'align'),
      disabled,
      run: disabled ? undefined : () => onDelete(checkValue.value),
    },
  ]
})

function onDelete(records: ObjectItemInfo[]) {
  if (records.length <= 0) {
    return
  }
  const content =
    records.length === 1
      ? globalProperties.$t('common.delete.confirmSingle')
      : globalProperties.$t('common.delete.confirmBatch', {count: records.length})
  modal.confirm({
    title: globalProperties.$t('common.delete.confirmTitle'),
    content,
    onOk: () => doDelete(records),
  })
}

async function doDelete(records: ObjectItemInfo[]) {
  try {
    loading.value = true
    const result:RestResult<void> = await AttachmentService.removeAttachment(records.map(k => ({bucketName: 'user.file', objectName: k.objectName})))
    message.success(result.message)
    await loadDataSource()
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false
  }
}

async function loadDataSource() {
  try {
    loading.value = true;
    const result: RestResult<ObjectItemInfo[]> = await service.find({
      type: 'user.file',
    })
    dataSource.value = result.data || []
  } finally {
    loading.value = false
  }
}

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

onMounted(() => loadDataSource())

</script>

<template>
  <div>
    <l-menu-title-card :loading="loading" :classes="{body:'max-h-150 overflow-auto'}">
      <template #extra>
        <l-action-button :actions="actions"/>
      </template>
      <a-masonry
        v-if="dataSource.length > 0"
        :columns="{ xs: 1, sm: 2, md: 3, lg: 4 }"
        :gutter="configProviderStore.getToken().sizeMD"
        :items="dataSource"
      >
        <template #itemRender="item">
          <a-card size="small">
            <template #cover>
              <l-basic-image class="w-full" v-if="(item.userMetadata?.['content-type'] || '').startsWith('image/')" :src="AttachmentService.query('user.file',item.objectName)"/>
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
    </l-menu-title-card>
  </div>
</template>
