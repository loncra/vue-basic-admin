import {h, ref} from 'vue'
import {Badge} from 'antdv-next'
import {
  defineHomePage,
  iconNameCell,
  type ActionContext,
  type RecordActionContext,
} from '@loncra/antdv-pro'
import type {SkillPackageEntity, SkillPackageSavePayload} from '@loncra/client/ai'
import {getEnumName, getEnumValue} from '@loncra/client/commons'
import i18n from '@/i18n'
import {defineSearchProps, getExecuteBadgeStatus, renderIconFont} from '@/utils'
import {
  DATA_RELEASE_STATUS,
  DATA_STATUS,
  EXECUTE_STATUS_TYPE,
  EXECUTE_TYPE_RETRY_STATUS,
  SKILL_GROUP_CODE_PREFIX,
  SKILL_PACKAGE_AUTHORITY,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import {skillPackageCore, skillPackageService} from './skill-package.page'

/**
 * 快照弹层：行内动作 `snapshot` 要打开**壳里的**弹层（表单与校验在壳里，壳才有 `l-form` 的 ref），
 * 所以状态从声明导出、壳只负责渲染与提交 —— 与 `enterprise-invitation` 的分享弹层同款接缝。
 */
export const skillSnapshot = ref({
  open: false,
  packageId: undefined as number | undefined,
  spinning: false,
  form: {releaseVersion: '', changelog: ''},
})

/** 执行状态：带徽标的名称（`a-badge`）；没有值时**返回 `undefined`** 交回表格自己渲染 */
function executeStatusBadgeCell(_value: unknown, record: SkillPackageEntity) {
  if (!record.executeStatus) {
    return undefined
  }
  return h(Badge, {
    status: getExecuteBadgeStatus(record.executeStatus),
    text: getEnumName(record.executeStatus),
  })
}

/** 可发布的：新建 / 已撤销，且**有版本**（没有版本发布不了） */
function releasable(items: SkillPackageEntity[]) {
  return items.filter(
    (item) => DATA_RELEASE_STATUS.includes(getEnumValue(item.status)) && Boolean(item.latestVersion),
  )
}

/** 可撤销的：已发布 */
function revocable(items: SkillPackageEntity[]) {
  return items.filter((item) => getEnumValue(item.status) === DATA_STATUS.RELEASE)
}

/** 可重跑的：待执行 / 失败 / 未知 */
function reingestable(items: SkillPackageEntity[]) {
  return items.filter((item) =>
    EXECUTE_TYPE_RETRY_STATUS.includes(getEnumValue(item.executeStatus ?? 0)),
  )
}

/**
 * 发布：确认框 → 调接口 → 提示 → **刷新列表**（发布后行状态变了，不刷新用户看到的是旧状态）。
 * `fetchDataSource` 由集合组件注入（`ctx.app.collection`），声明里不需要壳的 ref。
 */
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

/** 撤销：同发布 */
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

/** 重跑：同发布（后端重新解析技能包内容） */
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

/** 打开快照弹层（每次进来都是空表单；提交在壳里，见 `Home.vue`） */
function openSnapshot(ctx: RecordActionContext<SkillPackageEntity>): void {
  skillSnapshot.value.packageId = Number(ctx.record?.id)
  skillSnapshot.value.form = {releaseVersion: '', changelog: ''}
  skillSnapshot.value.open = true
}

/** 技能包列表（`Home.vue`）。核心在 `skill-package.page.ts`，这里只写列表形态。 */
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
        // 名称前带包图标：布局在 pro（`iconNameCell`），图标怎么画由宿主注入
        render: iconNameCell({
          renderIcon: renderIconFont,
          nameOf: (record) => record.name,
          iconOf: (record) => record.icon,
        }),
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
        render: executeStatusBadgeCell,
      },
      {key: 'latestVersion', width: 120, search: defineSearchProps('input')},
      {
        key: 'category',
        width: 150,
        // pro 默认按列 key 拼查询名，拼不出 `category.code`
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
