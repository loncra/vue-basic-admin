import {
  createIcon, filterTreeDeep, findFirstTreeNode, requireNonNullOrUndefined,
  validateFileOrFolderName
} from '@/utils'
import {
  type ComponentInternalInstance,
  computed,
  getCurrentInstance,
  onMounted,
  ref,
  watch
} from 'vue'
import type {FileEditorProps} from "@/types/composables/attachmentUpload.ts";
import type {EditObjectItemInfo, ObjectItemInfo, ObjectWriteResult, RestResult} from "@/types/apis";
import type {MenuItemType, UploadChangeParam} from "antdv-next";
import type {MenuInfo} from "@v-c/menu";
import useApp from "antdv-next/dist/app/useApp";
import {AttachmentService} from "@/apis";
import {isBusinessSuccess} from "@/requests";
import type {UploadFile} from "antdv-next/dist/upload/interface";
import {uploadFile} from "@/composables";

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
    tabs: ObjectItemInfo[]
    currentEditItem?: EditObjectItemInfo
    dataSource:ObjectItemInfo[]
    loading:boolean
    upload:{
      session:number
      directory:boolean
    }
  }>({
    loading:true,
    openKeys: [],
    tabs: [],
    dataSource:[],
    upload:{
      session:0,
      directory:false
    }
  })

  const fileUploadTrigger = ref<HTMLElement>()
  const dirUploadTrigger = ref<HTMLElement>()
  const uploadTarget = ref<ObjectItemInfo>()

  function resolveIcon(item: ObjectItemInfo): string {
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

  async function onOperationMenuClick(menuItem: MenuInfo, item: ObjectItemInfo) {
    if (menuItem.key === 'rename') {
      renameItem(item)
    } else if (menuItem.key === 'delete' && item) {
      modal.confirm({
        title: globalProperties.$t('common.delete.confirmTitle'),
        content: globalProperties.$t('common.delete.confirmSingle'),
        onOk: () => doDelete(item!),
      })
    } else if (menuItem.key === 'refresh') {
      await reloadChildren(item)
    } else if (menuItem.key === 'uploadFile') {
      openUpload(false,item)
    } else if (menuItem.key === 'uploadDirectory') {
      openUpload(true,item)
    }
  }

  async function reloadChildren(item: ObjectItemInfo) {
    state.value.openKeys = state.value.openKeys.filter(k => k !== item.id)
    delete item.children
    await loadChildren(item)
  }

  function openUpload(directory:boolean, item?: ObjectItemInfo) {
    const trigger = directory ? dirUploadTrigger.value : fileUploadTrigger.value
    if ((item && !item.dir) || !trigger) {
      return
    }
    uploadTarget.value = item
    trigger.click()
  }

  async function onUploadChange(info: UploadChangeParam) {
    const target = uploadTarget.value
    const files = info.fileList.filter((file): file is UploadFile => !!file.originFileObj)
    if ((target && !target?.dir) || files.length === 0 || state.value.loading) {
      return
    }
    state.value.loading = true
    try {
      await Promise.all(
        files.map((file) =>
          uploadFile(file, props.bucket, {
            postFilename: 'file',
            promiseLimit: 3,
            param: {
              prefix: target?.objectName || props.path,
              randomName: false,
            },
          }),
        ),
      )
      if (target) {
        await reloadChildren(target)
      } else {
        await loadDataSource(props.bucket,props.path)
      }
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e))
    } finally {
      state.value.loading = false
      uploadTarget.value = undefined
      state.value.upload.session++
    }
  }

  async function doDelete(item: ObjectItemInfo) {
    try {
      state.value.loading = true
      const result:RestResult<void> = await AttachmentService.removeAttachment([{bucketName: props.bucket, objectName: item.objectName}])
      message.success(result.message)
      state.value.dataSource = filterTreeDeep(p => p.id !== item.id, state.value.dataSource)
      closeTabsForRemoved(item)
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
          label: globalProperties.$t('attachment.upload.file'),
          key: 'uploadFile',
          icon: () => createIcon('loncra-upload'),
        },{
          label: globalProperties.$t('attachment.upload.directory'),
          key: 'uploadDirectory',
          icon: () => createIcon('loncra-hard-drive-upload'),
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

  function openTab(item: ObjectItemInfo) {
    if (item.dir) {
      return
    }
    if (!state.value.tabs.some(t => t.id === item.id)) {
      state.value.tabs = [...state.value.tabs, item]
    }
    state.value.selectedItem = item
  }

  function activateTab(id: string) {
    const found = state.value.tabs.find(t => t.id === id)
    if (found) {
      state.value.selectedItem = found
    }
  }

  function closeTab(id: string) {
    const list = state.value.tabs
    const i = list.findIndex(t => t.id === id)
    if (i === -1) {
      return
    }
    const next = list[i + 1] ?? list[i - 1]
    state.value.tabs = list.filter(t => t.id !== id)
    state.value.selectedItem = next
  }

  function closeTabsForRemoved(item: ObjectItemInfo) {
    const remaining = state.value.tabs.filter((t) => {
      if (t.id === item.id) {
        return false
      }
      return !(item.dir && t.objectName.startsWith(item.objectName))
    })
    const activeGone = !remaining.some(t => t.id === state.value.selectedItem?.id)
    state.value.tabs = remaining
    if (activeGone) {
      state.value.selectedItem = remaining[remaining.length - 1]
    }
  }

  function clearTabs() {
    state.value.tabs = []
    state.value.selectedItem = undefined
  }

  async function onMenuClick(item: EditObjectItemInfo) {
    if (item.dir) {
      await loadChildren(item)
      return
    }
    openTab(item)
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

  async function onRefresh() {
    state.value.openKeys = []
    clearTabs()
    await loadDataSource(props.bucket, props.path)
  }

  function onDownloadFile(item:ObjectItemInfo) {
    AttachmentService.download(props.bucket, item.objectName)
  }

  function onCopyFile(item:ObjectItemInfo) {

  }

  const tabItems = computed(() =>
    state.value.tabs.map((file) => ({
      key: file.id,
      label: getDisplayName(file),
      iconType: resolveIcon(file),
      file,
    })),
  )

  watch(
    () => [props.path, props.bucket],
    () => {
      clearTabs()
      loadDataSource(props.bucket, props.path)
    }
  )

  onMounted(() => loadDataSource(props.bucket, props.path))

  return {
    resolveIcon,
    fileUploadTrigger,
    dirUploadTrigger,
    createMenu,
    onMenuClick,
    activateTab,
    closeTab,
    onRefresh,
    cancelEdit,
    confirmEdit,
    onDownloadFile,
    onCopyFile,
    onUploadChange,
    tabItems,
    onRootUpload:(directory:boolean) => openUpload(directory, undefined),
    getDisplayName,
    state
  }
}
