import {
  createIcon, filterTreeDeep, findFirstTreeNode, requireNonNullOrUndefined,
  validateFileOrFolderName
} from '@/utils'
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref, watch} from 'vue'
import type {FileEditorProps} from "@/types/composables/attachmentUpload.ts";
import type {EditObjectItemInfo, ObjectItemInfo, ObjectWriteResult, RestResult} from "@/types/apis";
import type {MenuItemType} from "antdv-next";
import type {MenuInfo} from "@v-c/menu";
import useApp from "antdv-next/dist/app/useApp";
import {AttachmentService} from "@/apis";
import {isBusinessSuccess} from "@/requests";

export function useFileEditor(
  props: FileEditorProps
) {

  const globalProperties =
    requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
      .globalProperties

  const {modal, message} = useApp()

  const state = ref<{
    openKeys: string[]
    selectedItem?: ObjectItemInfo
    currentEditItem?: EditObjectItemInfo
    dataSource:ObjectItemInfo[]
    loading:boolean
  }>({
    loading:true,
    openKeys: [],
    dataSource:[]
  })

  function resolveIcon(item: EditObjectItemInfo): string {
    if (item.dir) {
      return state.value.openKeys.includes(item.id) ? 'loncra-folder-open' : 'loncra-folder-closed'
    } else {
      return props.getIcon?.(item) ?? 'loncra-file'
    }
  }

  function toEditObjectItemInfo(item:ObjectItemInfo, replacePath:string){
    const edit = item as EditObjectItemInfo
    if (edit.dir) {
      edit.userMetadata = {}
      edit.userMetadata['X-Amz-Meta-Original-Filename'] = item.objectName
        .replaceAll(replacePath, '')
        .replaceAll('/', '')
    }
    edit.key = item.id
    return edit
  }

  function getDisplayName(item:ObjectItemInfo) {
    return item.userMetadata?.['X-Amz-Meta-Original-Filename']
      || item.objectName.replace(/\/$/, '').split('/').pop()
      || item.objectName
  }

  async function loadDataSource(bucket:string, path:string){
    try {
      state.value.loading = true
      const result:RestResult<ObjectItemInfo[]> = await AttachmentService.findAttachment(bucket,path)
      const data = result.data || []
      data.filter(c => c.dir).forEach(c => toEditObjectItemInfo(c, path))
      state.value.dataSource = data
    } finally {
      state.value.loading = false
    }
  }

  function renameItem(item: ObjectItemInfo) {
    state.value.currentEditItem = item as EditObjectItemInfo
    state.value.currentEditItem.editing = true
    state.value.currentEditItem.editName = getDisplayName(item);
  }

  function onOperationMenuClick(menuItem: MenuInfo, item: ObjectItemInfo) {
    if (menuItem.key === 'rename') {
      renameItem(item)
    } else if (menuItem.key === 'delete' && item) {
      modal.confirm({
        title: globalProperties.$t('common.delete.confirmTitle'),
        content: globalProperties.$t('common.delete.confirmSingle'),
        onOk: () => doDelete(item!),
      })
    }
  }

  async function doDelete(item: ObjectItemInfo) {
    try {
      state.value.loading = true
      const result:RestResult<void> = await AttachmentService.removeAttachment([{bucketName: props.bucket, objectName: item.objectName}])
      message.success(result.message)
      state.value.dataSource = filterTreeDeep(p => p.id !== item.id, state.value.dataSource)
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      state.value.loading = false
    }
  }

  function createMenu(item:ObjectItemInfo) {
    const menu = {
      items: [] as MenuItemType[],
      onClick: (menuItem: MenuInfo) => onOperationMenuClick(menuItem, item),
    }
    if (item.dir) {
      menu.items.push(
        {
          label: globalProperties.$t('common.refresh'),
          key: 'refresh',
          icon: () => createIcon('loncra-refresh-cw'),
        },{
          label: globalProperties.$t('attachment.upload'),
          key: 'upload',
          icon: () => createIcon('loncra-upload'),
        }
      )
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
    return menu
  }

  async function onMenuClick(item: EditObjectItemInfo) {
    if (item.dir) {
      await loadChildren(item)
    }
  }

  function cancelEdit(item:EditObjectItemInfo) {
    state.value.currentEditItem = undefined
  }

  async function confirmEdit(item:EditObjectItemInfo) {
    const name = item.editName?.trim() ?? ''
    const errorKey = validateFileOrFolderName(name)
    if (errorKey) {
      return message.warning(globalProperties.$t(errorKey))
    }
    const splits = item.objectName.split('/');
    if (splits.length == 0) {
      return
    }
    splits[splits.length - 1] = item.editName
    const newObjectName = splits.join('/')
    try {
      state.value.loading = true
      const result:RestResult<ObjectWriteResult> = await AttachmentService.moveAttachment({
        source:{bucketName:props.bucket, objectName:item.objectName},
        target:{bucketName:props.bucket, objectName:newObjectName}
      })
      if (isBusinessSuccess(result) && result.data) {
        const exist = findFirstTreeNode(p => p.id === item.id, state.value.dataSource)
        if (exist) {
          exist.objectName = newObjectName
          exist.etag = result.data.etag
          exist.lastModified = result.data.lastModified
          exist.size = result.data.size
          exist.userMetadata = (result.data.extraHeaders || {})
          if (exist.dir) {
            exist.userMetadata['X-Amz-Meta-Original-Filename'] = item.editName
          }
        }
        state.value.currentEditItem = undefined
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      state.value.loading = false
    }
  }

  async function loadChildren(item:ObjectItemInfo){
    if (state.value.openKeys.includes(item.id)) {
      state.value.openKeys = state.value.openKeys.filter(k => k !== item.id)
    } else {
      state.value.openKeys = [...state.value.openKeys, item.id]
    }

    if(item.children !== undefined) {
      return
    }

    try {
      item.loading = true
      const result:RestResult<ObjectItemInfo[]> = await AttachmentService.findAttachment(props.bucket,item.objectName)
      const data = result.data || []
      item.children = data.map(c => toEditObjectItemInfo(c, item.objectName))
      state.value.openKeys = [...state.value.openKeys, item.id]
    } finally {
      item.loading = false
    }
  }

  watch(
    () => [props.path, props.bucket],
    () => loadDataSource(props.bucket, props.path)
  )

  onMounted(() => loadDataSource(props.bucket, props.path))

  return {
    resolveIcon,
    createMenu,
    onMenuClick,
    cancelEdit,
    confirmEdit,
    getDisplayName,
    state
  }
}
