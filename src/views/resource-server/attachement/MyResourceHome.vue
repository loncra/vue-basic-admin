<script setup lang="ts">
import {renderIconFont} from '@/utils/commonUtils'

import type {ObjectItemInfo} from "@loncra/client/resource";
import {AttachmentService, MyResourceService} from "@loncra/client/resource";
import {requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, computed, getCurrentInstance, onMounted, ref} from "vue";
import type {RestResult} from "@loncra/client/commons";
import type {ResolvedAction} from '@loncra/antdv-pro';
import {
  ActionButton as LActionButton,
  AttachmentMasonry as LAttachmentMasonry
} from '@loncra/antdv-pro';
import useApp from "antdv-next/dist/app/useApp";
import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";

defineOptions({
  name: 'CommonUserExport',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

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
      icon: renderIconFont('loncra-download', 'align'),
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
      icon: renderIconFont('loncra-archive-x', 'align'),
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

onMounted(() => loadDataSource())

</script>

<template>
  <div>
    <l-menu-title-card :loading="loading" :classes="{body:'max-h-150 overflow-auto'}">
      <template #extra>
        <l-action-button :actions="actions"/>
      </template>
      <l-attachment-masonry v-model:data-source="dataSource" :check-value="checkValue" />
    </l-menu-title-card>
  </div>
</template>
