import {defineHomePage, iconNameCell, type ActionContext} from '@loncra/antdv-pro'
import type {McpPackageEntity, McpPackageSavePayload} from '@loncra/client/ai'
import {getEnumValue} from '@loncra/client/commons'
import i18n from '@/i18n'
import {defineSearchProps, renderIconFont} from '@/utils'
import {
  DATA_STATUS,
  MCP_GROUP_CODE_PREFIX,
  MCP_PACKAGE_AUTHORITY,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import {mcpPackageCore, mcpPackageService} from './mcp-package.page'

/** 可发布的：新建 / 已撤销（与行内 `release` 的 `enabled` 同一判据） */
function releasable(items: McpPackageEntity[]) {
  return items.filter((item) => {
    const status = getEnumValue(item.status)
    return status === DATA_STATUS.NEW || status === DATA_STATUS.REVOKE
  })
}

/** 可撤销的：已发布 */
function revocable(items: McpPackageEntity[]) {
  return items.filter((item) => getEnumValue(item.status) === DATA_STATUS.RELEASE)
}

/**
 * 发布：确认框 → 调接口 → 提示 → **刷新列表**（发布后行状态变了，不刷新用户看到的是旧状态）。
 * `fetchDataSource` 由集合组件注入（`ctx.app.collection`），声明里不需要壳的 ref。
 */
function releasePackages(ctx: ActionContext<McpPackageEntity>, ids: number[]): void {
  if (ids.length === 0) {
    return
  }
  void ctx.app.modal.confirm({
    title: i18n.global.t('common.release.confirmTitle'),
    content:
      ids.length === 1
        ? i18n.global.t('common.release.confirmSingle')
        : i18n.global.t('common.release.confirmBatch', {count: ids.length}),
    onOk: async () => {
      const result = await mcpPackageService.release(ids)
      void ctx.app.message.success(result.message)
      await ctx.app.collection.fetchDataSource()
    },
  })
}

/** 撤销：同发布 */
function revokePackages(ctx: ActionContext<McpPackageEntity>, ids: number[]): void {
  if (ids.length === 0) {
    return
  }
  void ctx.app.modal.confirm({
    title: i18n.global.t('common.revoke.confirmTitle'),
    content:
      ids.length === 1
        ? i18n.global.t('common.revoke.confirmSingle')
        : i18n.global.t('common.revoke.confirmBatch', {count: ids.length}),
    onOk: async () => {
      const result = await mcpPackageService.revoke(ids)
      void ctx.app.message.success(result.message)
      await ctx.app.collection.fetchDataSource()
    },
  })
}

/** MCP 包列表（`Home.vue`）。核心在 `mcp-package.page.ts`，这里只写列表形态。 */
export const mcpPackageHomePage = defineHomePage<McpPackageSavePayload, McpPackageEntity>(
  mcpPackageCore,
  {
    authority: {
      add: MCP_PACKAGE_AUTHORITY.SAVE,
      edit: MCP_PACKAGE_AUTHORITY.SAVE,
      delete: MCP_PACKAGE_AUTHORITY.DELETE,
      detail: MCP_PACKAGE_AUTHORITY.GET,
    },
    rowSelection: {fixed: true, type: 'checkbox'},
    columns: [
      {
        key: 'name',
        width: 320,
        // 旧实现这里是**没有 options 源的空下拉**，改成按名称模糊查
        search: defineSearchProps('input'),
        // 名称前带包图标：布局在 pro（`iconNameCell`），图标怎么画由宿主注入
        render: iconNameCell({
          renderIcon: renderIconFont,
          nameOf: (record) => record.name,
          iconOf: (record) => record.icon,
        }),
      },
      {key: 'authMode', width: 120, search: defineSearchProps('select')},
      // 包装键要精确匹配（旧实现就是 `eq`）
      {key: 'packageKey', width: 160, search: defineSearchProps('input', {expression: 'eq'})},
      {key: 'origin', width: 80, search: defineSearchProps('select')},
      {key: 'status', width: 80, search: defineSearchProps('select')},
      {key: 'type', width: 80, search: defineSearchProps('select')},
      {
        key: 'category',
        width: 150,
        // pro 默认按列 key 拼查询名，拼不出 `category.code`
        search: defineSearchProps('select', {queryName: 'filter_[category.code_jeq]'}),
      },
      {key: 'dynamicActivation', width: 120, search: defineSearchProps('select')},
    ],
    toolbarActions: [
      {
        id: 'releaseSelect',
        permission: MCP_PACKAGE_AUTHORITY.RELEASE,
        enabled: (ctx) => releasable(ctx.selectedItems).length > 0,
        label: (ctx) =>
          i18n.global.t('common.release.selected', {count: releasable(ctx.selectedItems).length}),
        icon: () => renderIconFont('loncra-screen-share'),
        run: (ctx) => releasePackages(ctx, releasable(ctx.selectedItems).map((item) => Number(item.id))),
      },
      {
        id: 'revokeSelect',
        permission: MCP_PACKAGE_AUTHORITY.REVOKE,
        enabled: (ctx) => revocable(ctx.selectedItems).length > 0,
        label: (ctx) =>
          i18n.global.t('common.revoke.selected', {count: revocable(ctx.selectedItems).length}),
        icon: () => renderIconFont('loncra-screen-share-off'),
        run: (ctx) => revokePackages(ctx, revocable(ctx.selectedItems).map((item) => Number(item.id))),
      },
    ],
    recordActions: [
      {
        id: 'release',
        permission: MCP_PACKAGE_AUTHORITY.RELEASE,
        enabled: (ctx) => getEnumValue(ctx.record!.status) !== DATA_STATUS.RELEASE,
        label: () => i18n.global.t('common.release.text'),
        icon: () => renderIconFont('loncra-screen-share'),
        run: (ctx) => releasePackages(ctx, [Number(ctx.record!.id)]),
      },
      {
        id: 'revoke',
        permission: MCP_PACKAGE_AUTHORITY.REVOKE,
        enabled: (ctx) => getEnumValue(ctx.record!.status) === DATA_STATUS.RELEASE,
        label: () => i18n.global.t('common.revoke.text'),
        icon: () => renderIconFont('loncra-screen-share-off'),
        run: (ctx) => revokePackages(ctx, [Number(ctx.record!.id)]),
      },
    ],
  },
)
