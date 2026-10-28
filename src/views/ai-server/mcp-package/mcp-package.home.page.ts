import {type ActionContext, defineHomePage} from '@loncra/antdv-pro'
import type {McpPackageEntity, McpPackageSavePayload} from '@loncra/client/ai'
import {MCP_PACKAGE_AUTHORITY} from '@loncra/client/ai'
import {DATA_STATUS, getEnumValue} from '@loncra/client/commons'
import i18n from '@/i18n'
import {defineSearchProps, renderIconFont} from '@/utils'
import {mcpPackageCore, mcpPackageService} from './mcp-package.page'

function releasable(items: McpPackageEntity[]) {
  return items.filter((item) => {
    const status = getEnumValue(item.status)
    return status === DATA_STATUS.NEW || status === DATA_STATUS.REVOKE
  })
}

function revocable(items: McpPackageEntity[]) {
  return items.filter((item) => getEnumValue(item.status) === DATA_STATUS.RELEASE)
}

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
        search: defineSearchProps('input'),
        format: {name: 'iconName', args: {size: 'large'}},
      },
      {key: 'authMode', width: 120, search: defineSearchProps('select')},
      {key: 'packageKey', width: 160, search: defineSearchProps('input', {expression: 'eq'})},
      {key: 'origin', width: 80, search: defineSearchProps('select')},
      {key: 'status', width: 80, search: defineSearchProps('select')},
      {key: 'type', width: 80, search: defineSearchProps('select')},
      {
        key: 'category',
        width: 150,
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
