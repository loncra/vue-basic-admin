<script setup lang="ts">

import type {MenuItemType, UploadChangeParam} from "antdv-next";
import type {ObjectWriteResult} from "@/types/apis";
import {createIcon, filterTreeDeep, requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import {FOLDER_ADD_TYPE} from "@/constants";
import type {MenuInfo} from "@v-c/menu";
import useApp from "antdv-next/dist/app/useApp";
import LAttachmentUpload from "@/components/attachment/AttachmentUpload.vue";
import type {AttachmentFileItem} from "@/types/composables/attachmentUpload.ts";
import type {UploadFile} from "antdv-next/dist/upload/interface";
import type {FileItem} from "@/types/composables";

defineOptions({
  name: 'LFileEditor',
})

const props = withDefaults(
  defineProps<{
    readonly?: boolean
    name?:string
    bucket?:string
    getIcon?:(item:FileItem) => string
  }>(),
  {
    bucket:'temp',
    readonly: false,
  },
)

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const {modal} = useApp()

const selectedKeys = defineModel<string[]>('selectedKeys', {default:() => []})
const items = defineModel<FileItem[]>('items', {default:() => []})

const attachmentValue = ref<AttachmentFileItem[]>([])

const state = ref<{
  openKeys:string[]
  selectedItem?:FileItem
}>({
  openKeys:[]
})

function onItemClick(item:FileItem) {
  state.value.selectedItem = item
  if (item.type === FOLDER_ADD_TYPE.FOLDER) {
    attachmentValue.value = getAttachment(item.children || [])
  } else {
    attachmentValue.value = []
  }

}

function addFolder(parent?:FileItem) {
  const item = {
    key: String(crypto.randomUUID()),
    label: '',
    editing: true,
    type:FOLDER_ADD_TYPE.FOLDER
  }

  addItem(item, parent)
}

function addFile(parent?:FileItem) {
  const item = {
    key: String(crypto.randomUUID()),
    label: '',
    editing: true,
    type:FOLDER_ADD_TYPE.FILE
  }

  if(parent){
    state.value.openKeys = [...state.value.openKeys, parent.key as string]
  }

  addItem(item, parent)
}

function resolveIcon(item: FileItem): string {
  return props.getIcon?.(item)
    ?? (item.type === FOLDER_ADD_TYPE.FILE ? 'loncra-file' : 'loncra-folder')
}

function iconOfUploadFile(file: UploadFile<ObjectWriteResult>): string {
  const item = state.value.selectedItem?.children?.find(child => child.key === file.uid)
  return item ? resolveIcon(item) : 'loncra-file'
}

function isFolderFile(file:UploadFile<ObjectWriteResult>) {
  const item = state.value.selectedItem?.children?.find(child => child.key === file.uid)
  if (!item) {
    return false
  }
  return item.type === FOLDER_ADD_TYPE.FOLDER
}

function getAttachment(items: FileItem[]): AttachmentFileItem[] {
  const result: AttachmentFileItem[] = []
  for (const item of items) {
    if (item.content && typeof item.content === 'object' && 'objectName' in item.content) {
      result.push(item.content)
      continue
    }
    if (item.type === FOLDER_ADD_TYPE.FOLDER || typeof item.content === 'string') {
      result.push({
        uid: String(item.key),
        name: String(item.label ?? ''),
        status: 'done',
      })
    }
  }
  return result
}

function addItem(item: FileItem, parent?:FileItem) {
  if (parent) {
    parent.children = parent.children || []
    parent.children.push(item)
  } else {
    items.value.push(item)
  }
}

function cancelEdit(item: FileItem): void {
  if (item.original) {
    item.label = item.original
    delete item.original
  }
  item.editing = false

}

async function confirmEdit(item: FileItem): Promise<void> {
  item.editing = false
  delete item.original
}

function renameItem(item: FileItem) {
  item.original = item.label as string
  item.editing = true
}

function doDelete(item: FileItem) {
  items.value = filterTreeDeep(p => p.key !== item.key, items.value)
}

function onAttachmentChange(info:UploadChangeParam) {
  if (!state.value.selectedItem) {
    return
  }
  state.value.selectedItem.children = info.fileList.map(f => ({key:f.uid, label:f.name, type:FOLDER_ADD_TYPE.FILE}))
}

async function onOperationMenuClick(itemInfo: MenuInfo, item: FileItem) {
  if (itemInfo.key === 'rename') {
    renameItem(item)
  } else if (itemInfo.key === 'delete' && item) {
    modal.confirm({
      title: globalProperties.$t('common.delete.confirmTitle'),
      content: globalProperties.$t('common.delete.confirmSingle'),
      onOk: () => doDelete(item!),
    })
  } else if (itemInfo.key === 'creation' && item) {
    addFile(item)
  }
}

function createMenu(item: FileItem) {
  const menu = {
    items: [] as MenuItemType[],
    onClick: (menuItem: MenuInfo) => onOperationMenuClick(menuItem, item),
  }
  menu.items.push(
    {
      label: globalProperties.$t('common.rename'),
      key: 'rename',
      icon: () => createIcon('loncra-pencil'),
    },
    {
      type: 'divider' as const,
    },
    {
      label: globalProperties.$t('common.delete.text'),
      key: 'delete',
      danger: true,
      icon: () => createIcon('loncra-archive-x'),
    }
  )
  if (FOLDER_ADD_TYPE.FOLDER === item.type) {
    menu.items.unshift({
      label: globalProperties.$t('aiServer.skillPackage.add.file'),
      key: 'creation',
      icon: () => createIcon('loncra-plus'),
    })
  }
  return menu
}

</script>

<template>
  <a-splitter class="h-120 rounded-lg max-h-180 border border-border-secondary">
    <a-splitter-panel class="min-h-0 h-full" default-size="20%" min="10%" max="30%">
      <a-flex
        gap="small"
        justify="space-between"
        align="center"
        class="w-full p-xs border-b border-border-secondary"
      >
        <a-flex flex="1" gap="small" align="center">
          <icon-font class="icon" type="loncra-sparkles" />
          <a-typography-text ellipsis>
            <template v-if="props.name">{{props.name}}</template>
            <template v-else>{{globalProperties.$t('common.unname')}}</template>
          </a-typography-text>
        </a-flex>
        <a-space-compact v-if="!props.readonly" class="shrink-0">
          <a-tooltip :title="globalProperties.$t('aiServer.skillPackage.add.file')">
            <a-button size="small" @click="addFile(undefined)">
              <template #icon>
                <icon-font type="loncra-file-plus" />
              </template>
            </a-button>
          </a-tooltip>
          <a-tooltip :title="globalProperties.$t('aiServer.skillPackage.add.folder')">
            <a-button size="small" @click="addFolder(undefined)">
              <template #icon>
                <icon-font type="loncra-folder-plus" />
              </template>
            </a-button>
          </a-tooltip>
        </a-space-compact>
      </a-flex>
      <a-menu
        class="border-none folder-edit flex-1"
        mode="inline"
        v-model:selected-keys="selectedKeys"
        v-model:open-keys="state.openKeys"
        :items="items"
      >
        <template #iconRender="item">
          <icon-font :type="resolveIcon(item)" />
        </template>
        <template #labelRender="item">
          <a-space-compact
            v-if="item.editing"
            size="small"
            block
            @click.stop
            @mousedown.stop
          >
            <a-input
              v-model:value="item.label"
              @pressEnter="confirmEdit(item)"
            />
            <a-button
              type="primary"
              @click="confirmEdit(item)"
            >
              <template #icon>
                <icon-font type="loncra-check"/>
              </template>
            </a-button>
            <a-button
              type="primary"
              danger
              @click="cancelEdit(item)"
            >
              <template #icon>
                <icon-font type="loncra-x"/>
              </template>
            </a-button>
          </a-space-compact>
          <a-flex
            v-else
            class="group min-w-0 w-full"
            justify="space-between"
            align="center"
            @click="onItemClick(item)"
          >
            <a-typography-text
              class="min-w-0 flex-1"
              :ellipsis="{ tooltip: {title:item.name, mouseEnterDelay: 1}}"
            >
              {{ item.label }}
            </a-typography-text>
            <span class="relative inline-flex shrink-0 items-center justify-end" v-if="!item.readonly">
              <a-dropdown
                :menu="createMenu(item)"
              >
                <a-button
                  type="text"
                  size="small"
                  class="absolute opacity-0 transition-opacity duration-300 group-hover:static group-hover:opacity-100"
                  @click.stop
                  @mousedown.stop
                >
                  <template #icon>
                    <icon-font type="loncra-ellipsis"/>
                  </template>
                </a-button>
              </a-dropdown>
            </span>
          </a-flex>
        </template>
      </a-menu>
    </a-splitter-panel>
    <a-splitter-panel class="min-h-0 size-full">
      <a-flex
        v-if="state.selectedItem"
        vertical
        class="min-h-0 h-full overflow-hidden"
      >
        <a-flex
          justify="space-between"
          align="center"
          class="shrink-0 w-full p-xs border-b border-border-secondary"
        >
          <a-flex flex="1" gap="small" align="center">
            <icon-font :type="resolveIcon(state.selectedItem)" />
            <a-typography-text ellipsis>{{state.selectedItem.label}}</a-typography-text>
          </a-flex>
          <a-tooltip v-if="state.selectedItem.type === FOLDER_ADD_TYPE.FILE" :title="globalProperties.$t('common.copy')">
            <a-button size="small" >
              <template #icon>
                <icon-font type="loncra-copy" />
              </template>
            </a-button>
          </a-tooltip>
          <a-tooltip v-if="state.selectedItem.type === FOLDER_ADD_TYPE.FOLDER" :title="globalProperties.$t('common.delete.selected',{count:(state.selectedItem.children || []).length})">
            <a-button :disabled="(state.selectedItem.children || []).length <= 0" danger type="primary" size="small" >
              <template #icon>
                <icon-font type="loncra-archive-x" />
              </template>
            </a-button>
          </a-tooltip>
        </a-flex>
        <a-flex flex="1" class="size-full p-xs" >
          <a-textarea
            v-if="typeof state.selectedItem.content === 'string' && state.selectedItem.type === FOLDER_ADD_TYPE.FILE"
            v-model:value="state.selectedItem.content"
            class="size-full overflow-auto resize-none"
          />
          <l-attachment-upload
            v-else-if="state.selectedItem.type === FOLDER_ADD_TYPE.FOLDER"
            :value="attachmentValue"
            :can-preview="(file) => !isFolderFile(file)"
            :can-download="(file) => !isFolderFile(file)"
            mode="picture-card"
            @remove="(file) => doDelete({key:file.uid})"
            @change="(info) => onAttachmentChange(info)"
          >
            <template #itemIcon="{ file }">
              <icon-font class="text-2xl" :type="iconOfUploadFile(file)" />
            </template>
          </l-attachment-upload>
        </a-flex>
      </a-flex>

      <a-empty v-else />
    </a-splitter-panel>
  </a-splitter>
</template>
