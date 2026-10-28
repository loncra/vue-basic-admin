import {ref} from 'vue'
import {
  type ActionContext,
  defineHomePage,
  executeStatusCell,
  type RecordActionContext,
} from '@loncra/antdv-pro'
import type {SkillPackageEntity, SkillPackageSavePayload} from '@loncra/client/ai'
import {SKILL_PACKAGE_AUTHORITY} from '@loncra/client/ai'
import {
  DATA_RELEASE_STATUS,
  DATA_STATUS,
  EXECUTE_STATUS_TYPE,
  EXECUTE_TYPE_RETRY_STATUS,
  getEnumValue
} from '@loncra/client/commons'
import i18n from '@/i18n'
import {defineSearchProps, renderIconFont} from '@/utils'
import {skillPackageCore, skillPackageService} from './skill-package.page'

export const skillSnapshot = ref({
  open: false,
  packageId: undefined as number | undefined,
  spinning: false,
  form: {releaseVersion: '', changelog: ''},
})

function releasable(items: SkillPackageEntity[]) {
  return items.filter(
    (item) => DATA_RELEASE_STATUS.includes(getEnumValue(item.status)) && Boolean(item.latestVersion),
  )
}

function revocable(items: SkillPackageEntity[]) {
  return items.filter((item) => getEnumValue(item.status) === DATA_STATUS.RELEASE)
}

function reingestable(items: SkillPackageEntity[]) {
  return items.filter((item) =>
    EXECUTE_TYPE_RETRY_STATUS.includes(getEnumValue(item.executeStatus ?? 0)),
  )
}

function releasePackages(ctx: ActionContext<SkillPackageEntity>, ids: number[]): void {
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
      const result = await skillPackageService.release(ids)
      void ctx.app.message.success(result.message)
      await ctx.app.collection.fetchDataSource()
    },
  })
}

function revokePackages(ctx: ActionContext<SkillPackageEntity>, ids: number[]): void {
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
      const result = await skillPackageService.revoke(ids)
      void ctx.app.message.success(result.message)
      await ctx.app.collection.fetchDataSource()
    },
  })
}

function reingestPackages(ctx: ActionContext<SkillPackageEntity>, ids: number[]): void {
  if (ids.length === 0) {
    return
  }
  void ctx.app.modal.confirm({
    title: i18n.global.t('aiServer.skillPackage.reingest.confirmTitle'),
    content:
      ids.length === 1
        ? i18n.global.t('aiServer.skillPackage.reingest.confirmSingle')
        : i18n.global.t('aiServer.skillPackage.reingest.confirmBatch', {count: ids.length}),
    onOk: async () => {
      const result = await skillPackageService.reingest(ids)
      void ctx.app.message.success(result.message)
      await ctx.app.collection.fetchDataSource()
    },
  })
}

function openSnapshot(ctx: RecordActionContext<SkillPackageEntity>): void {
  skillSnapshot.value.packageId = Number(ctx.record?.id)
  skillSnapshot.value.form = {releaseVersion: '', changelog: ''}
  skillSnapshot.value.open = true
}

export const skillPackageHomePage = defineHomePage<SkillPackageSavePayload, SkillPackageEntity>(
  skillPackageCore,
  {
    authority: {
      add: SKILL_PACKAGE_AUTHORITY.SAVE,
      edit: SKILL_PACKAGE_AUTHORITY.SAVE,
      delete: SKILL_PACKAGE_AUTHORITY.DELETE,
      detail: SKILL_PACKAGE_AUTHORITY.GET,
    },
    rowSelection: {fixed: true, type: 'checkbox'},
    columns: [
      {
        key: 'name',
        width: 320,
        search: defineSearchProps('input'),
        format: {name: 'iconName', args: {size: 'large'}},
      },
      {key: 'packageKey', width: 160, search: defineSearchProps('input')},
      {key: 'origin', width: 80, search: defineSearchProps('select')},
      {key: 'status', width: 80, search: defineSearchProps('select')},
      {key: 'type', width: 80, search: defineSearchProps('select')},
      {key: 'defaultUpdatePolicy', width: 120, search: defineSearchProps('select')},
      {key: 'sourceType', width: 120, search: defineSearchProps('select')},
      {
        key: 'executeStatus',
        width: 120,
        search: defineSearchProps('select'),
        render: executeStatusCell(),
      },
      {key: 'latestVersion', width: 120, search: defineSearchProps('input')},
      {
        key: 'category',
        width: 150,
        search: defineSearchProps('select', {queryName: 'filter_[category.code_jeq]'}),
      },
    ],
    toolbarActions: [
      {
        id: 'releaseSelect',
        permission: SKILL_PACKAGE_AUTHORITY.RELEASE,
        enabled: (ctx) => releasable(ctx.selectedItems).length > 0,
        label: (ctx) =>
          i18n.global.t('common.release.selected', {count: releasable(ctx.selectedItems).length}),
        icon: () => renderIconFont('loncra-screen-share'),
        run: (ctx) =>
          releasePackages(ctx, releasable(ctx.selectedItems).map((item) => Number(item.id))),
      },
      {
        id: 'revokeSelect',
        permission: SKILL_PACKAGE_AUTHORITY.REVOKE,
        enabled: (ctx) => revocable(ctx.selectedItems).length > 0,
        label: (ctx) =>
          i18n.global.t('common.revoke.selected', {count: revocable(ctx.selectedItems).length}),
        icon: () => renderIconFont('loncra-screen-share-off'),
        run: (ctx) =>
          revokePackages(ctx, revocable(ctx.selectedItems).map((item) => Number(item.id))),
      },
      {
        id: 'reingestSelect',
        permission: SKILL_PACKAGE_AUTHORITY.REVOKE,
        enabled: (ctx) => reingestable(ctx.selectedItems).length > 0,
        label: (ctx) =>
          i18n.global.t('aiServer.skillPackage.reingest.selected', {
            count: reingestable(ctx.selectedItems).length,
          }),
        icon: () => renderIconFont('loncra-folder-sync'),
        run: (ctx) =>
          reingestPackages(ctx, reingestable(ctx.selectedItems).map((item) => Number(item.id))),
      },
    ],
    recordActions: [
      {
        id: 'snapshot',
        permission: SKILL_PACKAGE_AUTHORITY.SNAPSHOT,
        enabled: (ctx) => getEnumValue(ctx.record!.executeStatus ?? 0) === EXECUTE_STATUS_TYPE.SUCCESS,
        label: () => i18n.global.t('aiServer.skillPackage.snapshot.text'),
        icon: () => renderIconFont('loncra-package'),
        run: openSnapshot,
      },
      {
        id: 'release',
        permission: SKILL_PACKAGE_AUTHORITY.RELEASE,
        enabled: (ctx) =>
          getEnumValue(ctx.record!.status) !== DATA_STATUS.RELEASE && Boolean(ctx.record!.latestVersion),
        label: () => i18n.global.t('common.release.text'),
        icon: () => renderIconFont('loncra-screen-share'),
        run: (ctx) => releasePackages(ctx, [Number(ctx.record!.id)]),
      },
      {
        id: 'revoke',
        permission: SKILL_PACKAGE_AUTHORITY.REVOKE,
        enabled: (ctx) => getEnumValue(ctx.record!.status) === DATA_STATUS.RELEASE,
        label: () => i18n.global.t('common.revoke.text'),
        icon: () => renderIconFont('loncra-screen-share-off'),
        run: (ctx) => revokePackages(ctx, [Number(ctx.record!.id)]),
      },
      {
        id: 'reingest',
        permission: SKILL_PACKAGE_AUTHORITY.REVOKE,
        enabled: (ctx) =>
          EXECUTE_TYPE_RETRY_STATUS.includes(getEnumValue(ctx.record!.executeStatus ?? 0)),
        label: () => i18n.global.t('aiServer.skillPackage.reingest.text'),
        icon: () => renderIconFont('loncra-folder-sync'),
        run: (ctx) => reingestPackages(ctx, [Number(ctx.record!.id)]),
      },
    ],
  },
)
