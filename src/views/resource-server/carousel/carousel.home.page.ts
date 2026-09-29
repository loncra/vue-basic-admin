import {ref} from 'vue'
import {
  defineCardGridPage,
  type ActionAppApis,
  type ActionContext,
  type RecordActionContext,
  type ToolbarActionContext,
} from '@loncra/antdv-pro'
import type {CarouselEntity, CarouselSavePayload} from '@/types/apis'
import {getEnumValue, type TreeSortMetadata} from '@loncra/client/commons'
import i18n from '@/i18n'
import router from '@/routers'
import {renderIconFont} from '@/utils'
import {
  DATA_STATUS,
  RESOURCE_SERVER_CAROUSEL_AUTHORITY,
  RESOURCE_SERVER_CAROUSEL_ROUTE,
} from '@/constants'
import {CAROUSEL_TYPE_FILTER, carouselCore, carouselService} from './carousel.page'

/**
 * 预览轮播的"重载口"。
 *
 * 发布 / 撤销 / 拖拽排序都会改到"已发布"那一批，而**预览是壳的东西**（`a-tabs` 上方那块，
 * 属于页面结构、不进 pro）⇒ 声明里的动作干完活要把壳也刷一下。
 *
 * 为什么用这个口而不是 `extra`：动作与落库口的上下文里**没有 `extra`**
 * （`ToolbarActionContext` / `RecordActionContext` 只有 `app`）⇒ 声明与壳之间只能靠模块级
 * `ref` 传递：壳在挂载时把自己的实现填进来。两个文件都是宿主代码，不涉及 pro。
 */
export const carouselPreviewReloader = ref<(() => Promise<void>) | undefined>()

/** 未发布的（新建 / 已撤销）：**可发布、也可删除** —— 旧页面这两处用的是同一个判据 */
function unreleased(items: CarouselEntity[]) {
  return items.filter((item) => {
    const status = getEnumValue(item.status ?? 0)
    return status === DATA_STATUS.NEW || status === DATA_STATUS.REVOKE
  })
}

/** 已发布的：可撤销 */
function released(items: CarouselEntity[]) {
  return items.filter((item) => getEnumValue(item.status ?? 0) === DATA_STATUS.RELEASE)
}

/**
 * 发布：确认框 → 调接口 → 提示 → **刷本 tab 的网格 + 刷预览**
 * （发布后状态变了、预览那批也跟着变；`fetchDataSource` 由集合组件注入，声明里不需要壳的 ref）。
 */
function releaseCarousels(ctx: ActionContext<CarouselEntity>, ids: number[]): void {
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
      const result = await carouselService.release(ids)
      void ctx.app.message.success(result.message)
      await ctx.app.collection.fetchDataSource()
      await carouselPreviewReloader.value?.()
    },
  })
}

/** 撤销：同发布 */
function revokeCarousels(ctx: ActionContext<CarouselEntity>, ids: number[]): void {
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
      const result = await carouselService.revoke(ids)
      void ctx.app.message.success(result.message)
      await ctx.app.collection.fetchDataSource()
      await carouselPreviewReloader.value?.()
    },
  })
}

/**
 * 新增：**带上当前 tab 的类型**（新增页读 `?type=` 当初值）。
 * 类型就从网格**当前**的查询条件里取 —— 每个 tab 的 query 就是 `filter_[type_eq]`（与壳同源）。
 */
function addCarousel(ctx: ToolbarActionContext<CarouselEntity>): void {
  const type = (ctx.query as Record<string, unknown>)[CAROUSEL_TYPE_FILTER]
  void router.push({
    name: RESOURCE_SERVER_CAROUSEL_ROUTE.ADD,
    query: type == null ? undefined : {type: String(type)},
  })
}

/** 批量删除：只删未发布的（已发布的删不了）；`remove` 自己会确认 + 刷新（`useCrudDelete`） */
function deleteUnreleased(ctx: ToolbarActionContext<CarouselEntity>): void {
  ctx.app.collection.remove(unreleased(ctx.selectedItems))
}

/** 拖拽落库：调接口 → 提示 → 刷预览（预览按"已发布"过滤 + 按 sort 排，拖完顺序就变了） */
async function sortCarousels(
  sorts: TreeSortMetadata<number>[],
  app: ActionAppApis<CarouselEntity>,
): Promise<void> {
  try {
    const result = await carouselService.sort(sorts)
    void app.message.success(result.message)
    await carouselPreviewReloader.value?.()
  } catch (error) {
    app.message.error(error instanceof Error ? error.message : String(error))
  }
}

/**
 * 轮播图列表（`Home.vue` 的卡片布局）。核心在 `carousel.page.ts`，这里只写"卡片网格"那一份。
 *
 * 分工：**声明**放权限 / 动作 / 落库；**壳**只留页面结构（`a-tabs` + 预览轮播 + 每 tab 一个网格
 * 实例 + `#item` 卡片外观）—— 取数时机、分页、加载态都由组件自己编排。
 */
export const carouselHomePage = defineCardGridPage<CarouselSavePayload, CarouselEntity>(
  carouselCore,
  {
    authority: {
      add: RESOURCE_SERVER_CAROUSEL_AUTHORITY.SAVE,
      edit: RESOURCE_SERVER_CAROUSEL_AUTHORITY.SAVE,
      delete: RESOURCE_SERVER_CAROUSEL_AUTHORITY.DELETE,
      // 旧页面就没有"详情"入口 ⇒ 保持现状
      detail: false,
    },
    toolbarActions: [
      {
        id: 'add',
        permission: RESOURCE_SERVER_CAROUSEL_AUTHORITY.SAVE,
        icon: () => renderIconFont('loncra-file-plus'),
        label: () => i18n.global.t('common.add', {name: ''}),
        run: addCarousel,
      },
      {
        id: 'deleteSelected',
        permission: RESOURCE_SERVER_CAROUSEL_AUTHORITY.DELETE,
        enabled: (ctx) => unreleased(ctx.selectedItems).length > 0,
        label: (ctx) =>
          i18n.global.t('common.delete.selected', {count: unreleased(ctx.selectedItems).length}),
        icon: () => renderIconFont('loncra-archive-x'),
        run: deleteUnreleased,
      },
      {
        id: 'releaseSelect',
        permission: RESOURCE_SERVER_CAROUSEL_AUTHORITY.RELEASE,
        enabled: (ctx) => unreleased(ctx.selectedItems).length > 0,
        label: (ctx) =>
          i18n.global.t('common.release.selected', {count: unreleased(ctx.selectedItems).length}),
        icon: () => renderIconFont('loncra-screen-share'),
        run: (ctx) => releaseCarousels(ctx, unreleased(ctx.selectedItems).map((item) => Number(item.id))),
      },
      {
        id: 'revokeSelect',
        permission: RESOURCE_SERVER_CAROUSEL_AUTHORITY.REVOKE,
        enabled: (ctx) => released(ctx.selectedItems).length > 0,
        label: (ctx) =>
          i18n.global.t('common.revoke.selected', {count: released(ctx.selectedItems).length}),
        icon: () => renderIconFont('loncra-screen-share-off'),
        run: (ctx) => revokeCarousels(ctx, released(ctx.selectedItems).map((item) => Number(item.id))),
      },
    ],
    recordActions: [
      {
        id: 'release',
        permission: RESOURCE_SERVER_CAROUSEL_AUTHORITY.RELEASE,
        enabled: (ctx: RecordActionContext<CarouselEntity>) =>
          getEnumValue(ctx.record!.status ?? 0) !== DATA_STATUS.RELEASE,
        label: () => i18n.global.t('common.release.text'),
        icon: () => renderIconFont('loncra-screen-share'),
        run: (ctx) => releaseCarousels(ctx, [Number(ctx.record!.id)]),
      },
      {
        id: 'revoke',
        permission: RESOURCE_SERVER_CAROUSEL_AUTHORITY.REVOKE,
        enabled: (ctx: RecordActionContext<CarouselEntity>) =>
          getEnumValue(ctx.record!.status ?? 0) === DATA_STATUS.RELEASE,
        label: () => i18n.global.t('common.revoke.text'),
        icon: () => renderIconFont('loncra-screen-share-off'),
        run: (ctx) => revokeCarousels(ctx, [Number(ctx.record!.id)]),
      },
      // 覆盖内置 `edit`：已发布的不许改（其余字段照旧用内置的：跳转由页面 core 的 routes 兜）
      {
        id: 'edit',
        permission: RESOURCE_SERVER_CAROUSEL_AUTHORITY.GET,
        enabled: (ctx: RecordActionContext<CarouselEntity>) =>
          getEnumValue(ctx.record!.status ?? 0) !== DATA_STATUS.RELEASE,
        label: () => i18n.global.t('common.edit'),
        icon: () => renderIconFont('loncra-file-pen-line'),
      },
      // 旧页面没有"项内删除"（删除是批量动作）⇒ 把内置的那条按 id 关掉，行为保持现状
      {id: 'delete', visible: () => false},
    ],
    onDrop: ({sorts}, app) => sortCarousels(sorts, app),
  },
)
