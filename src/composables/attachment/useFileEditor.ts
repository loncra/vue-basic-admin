import {requireNonNullOrUndefined} from '@/utils'
import {type ComponentInternalInstance, getCurrentInstance, ref} from 'vue'
import {FOLDER_ADD_TYPE} from '@/constants'
import type {AttachmentPathItem} from "@/types/composables/attachmentUpload.ts";

export function useFileEditor(
  props: {
    readonly?: boolean
    name?: string
    path: string
    getIcon?: (item: AttachmentPathItem) => string
  }
) {

  const globalProperties =
    requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
      .globalProperties

  const state = ref<{
    openKeys: string[]
    selectedItem?: AttachmentPathItem
    dataSource:AttachmentPathItem[]
  }>({
    openKeys: [],
    dataSource:[]
  })

  function resolveIcon(item: AttachmentPathItem): string {
    return props.getIcon?.(item) ?? (item.type === FOLDER_ADD_TYPE.FILE ? 'loncra-file' : 'loncra-folder')
  }

  return {
    resolveIcon,
    state
  }
}
