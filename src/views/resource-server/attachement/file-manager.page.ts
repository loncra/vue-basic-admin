import {FileManagerService, type ObjectItemInfo} from '@loncra/client/resource'
import type {CrudPageCore} from '@loncra/antdv-pro'

/** 文件管理的读服务：列表取数 + 目录懒加载共用这一份 */
export const fileManagerService = new FileManagerService()

/**
 * 文件管理（`FileManagerHome.vue`）的核心：读服务 + i18n 前缀。
 *
 * **写操作不在核心**：下载 / 删除走 `AttachmentService` 的静态口，而且都要"当前 bucket"
 * ⇒ 写在列表形态的动作里（见 `file-manager.home.page.ts`）。本页没有新增 / 编辑 / 详情 / 导出。
 */
export const fileManagerCore: CrudPageCore<ObjectItemInfo, ObjectItemInfo> = {
  service: fileManagerService,
  i18nPrefix: 'resourceServer.attachment',
}
