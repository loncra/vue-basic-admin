import {ref} from 'vue'
import {
  AttachmentService,
  RESOURCE_SERVER_ATTACHMENT_AUTHORITY,
  type ObjectItemInfo,
} from '@loncra/client/resource'
import {
  type ActionAppApis,
  defineHomePage,
  type RecordActionDefinition,
  type ToolbarActionDefinition,
} from '@loncra/antdv-pro'
import i18n from '@/i18n'
import {defineSearchProps, renderIconFont} from '@/utils'
import {fileManagerCore} from './file-manager.page'

/**
 * 当前 bucket（**壳写的**）。
 *
 * 顶部那个 bucket 分段控件是**页面结构**（先于表格存在，与 `carousel/Home.vue` 的 tab 同款）
 * ⇒ 留在壳里；而下载 / 删除都要 `bucketName` ⇒ 壳切 bucket 时写进这个模块级 ref，声明里的动作读它
 * （"宿主自己的两侧状态"那条口径，与 `carousel.home.page.ts` 的 `carouselPreviewReloader` 同一手法）。
 */
export const fileManagerBucket = ref('')

/** 记录 → `AttachmentService` 要的 `{bucketName, objectName}`（下载 / 删除两个口都吃它） */
const objectsOf = (records: ObjectItemInfo[]) =>
  records.map((item) => ({bucketName: fileManagerBucket.value, objectName: item.objectName}))

/**
 * 删除：确认框走动作 ctx 的 `app.modal`、提示走 `app.message`、刷新走 `app.collection`
 * —— 这三样都是 pro 在 setup 里 `App.useApp()` 拿到后**注入**的（同一个实例）
 * ⇒ 声明里的动作不必再让壳转一手（旧版是壳自己 `useApp()` 后再调）。
 */
function removeObjects(app: ActionAppApis<ObjectItemInfo>, records: ObjectItemInfo[]): void {
  if (records.length === 0) {
    return
  }
  app.modal.confirm({
    title: i18n.global.t('common.delete.confirmTitle'),
    content:
      records.length === 1
        ? i18n.global.t('common.delete.confirmSingle')
        : i18n.global.t('common.delete.confirmBatch', {count: records.length}),
    onOk: async () => {
      const result = await AttachmentService.removeAttachment(objectsOf(records))
      app.message.success(result.message)
      await app.collection.fetchDataSource()
    },
  })
}

/**
 * 行内：下载。
 *
 * ⚠️ **`permission: true` 不能省**：`useActionAuth().can()` 对 `undefined` / `false` 直接返回 `false`
 * （fail-closed，`crud-config-provider/useCrudConfig.ts`）⇒ 动作会被过滤掉、按钮根本不显示。
 * 下载没有权限概念 ⇒ 显式 `true` = 永远显示（旧版同款）。
 */
const download: RecordActionDefinition<ObjectItemInfo> = {
  id: 'download',
  permission: true,
  label: () => i18n.global.t('common.download.text'),
  icon: () => renderIconFont('loncra-download'),
  run: (ctx) => {
    if (!ctx.record) {
      return
    }
    AttachmentService.download(fileManagerBucket.value, ctx.record.objectName)
  },
}

/**
 * 行内：删除。
 *
 * `id: 'delete'` 是 pro 的**默认动作 id** ⇒ 这里按字段覆盖它（`run` 换成走 `AttachmentService`）。
 * ⚠️ **覆盖时必须把 `permission` 重新写出来**：默认动作的权限来自 `authority.delete`
 * （`defaultActions.ts:106`），而合并是 `{...默认, ...声明}` ⇒ 只写 `run` 会把默认那份权限冲成 `undefined`；
 * 旧版写的是 `permission: true`（= 永远通过）⇒ 壳里那个 `authority: {delete: …}` **其实从没生效**。
 * 这里改成真实权限串：**有没有 DELETE 权限决定这个按钮显不显示**。
 */
const remove: RecordActionDefinition<ObjectItemInfo> = {
  id: 'delete',
  permission: RESOURCE_SERVER_ATTACHMENT_AUTHORITY.DELETE,
  label: () => i18n.global.t('common.delete.text'),
  icon: () => renderIconFont('loncra-archive-x'),
  run: (ctx) => {
    if (!ctx.record) {
      return
    }
    removeObjects(ctx.app, [ctx.record])
  },
}

/** 批量：下载选中（`ctx.selectedItems` 由 pro 注入；`permission: true` 的理由同行内那条，不能省） */
const downloadSelected: ToolbarActionDefinition<ObjectItemInfo> = {
  id: 'downloadSelected',
  permission: true,
  label: (ctx) => i18n.global.t('common.download.selected', {count: ctx.selectedItems.length}),
  enabled: () => true,
  icon: () => renderIconFont('loncra-download'),
  run: (ctx) => AttachmentService.downloads(objectsOf(ctx.selectedItems)),
}

/** 批量：删除选中（`id: 'deleteSelected'` 同样是默认动作 id ⇒ 覆盖它，`permission` 必须重写，理由同行内那条） */
const deleteSelected: ToolbarActionDefinition<ObjectItemInfo> = {
  id: 'deleteSelected',
  permission: RESOURCE_SERVER_ATTACHMENT_AUTHORITY.DELETE,
  label: (ctx) => i18n.global.t('common.delete.selected', {count: ctx.selectedItems.length}),
  enabled: () => true,
  icon: () => renderIconFont('loncra-archive-x'),
  run: (ctx) => removeObjects(ctx.app, ctx.selectedItems),
}

/**
 * 文件管理列表（`FileManagerHome.vue`）。
 *
 * **列 / 搜索 / 行内动作 / 批量动作 / 权限 / 行选择全在这里**（旧版这四样都写在壳里 —— 列、两个
 * `RecordActionDefinition`、`ToolbarActionDefinition`、`authority`）。壳只留三件"页面结构 + 状态"：
 * ① 顶部 bucket 分段控件；② 目录树（展开态 + 懒加载子级）；③ 单元格的画法（要前两样状态 ⇒ 走壳的 `#bodyCell`，
 * 这是 pro 给嵌入/定制单元格留的正门）。
 *
 * 表格自身的 `immediate=false` / `scroll` / `expandable` 由壳经 `$attrs` 传（`CrudHomePage` 直通 `CrudTable`）。
 */
export const fileManagerHomePage = defineHomePage(fileManagerCore, {
  /*
   * 这里**不写 `authority`**：`authority.*` 只喂 pro 的默认动作（`defaultActions.ts`），而本页把
   * `delete` / `deleteSelected` 两个默认 id 都覆盖了 ⇒ 写了也是死配置。权限统一写在动作自己的
   * `permission` 上（单一事实来源）。
   */
  rowSelection: {fixed: true, type: 'checkbox'},
  columns: [
    {
      key: 'filename',
      labelKey: 'resourceServer.attachment.filename',
      width: 650,
      ellipsis: true,
      // 旧版是 `search: {component: Input, queryName: 'filename'}` —— 查询名不写就是列 key，同一个字
      search: defineSearchProps('input'),
    },
    {key: 'uploader', labelKey: 'common.owner', width: 200, ellipsis: true},
    {key: 'size', labelKey: 'resourceServer.attachment.fileSize', width: 150, ellipsis: true},
    {
      key: 'lastModified',
      labelKey: 'resourceServer.attachment.lastModified',
      width: 210,
      ellipsis: true,
    },
  ],
  recordActions: [download, remove],
  toolbarActions: [downloadSelected, deleteSelected],
})
