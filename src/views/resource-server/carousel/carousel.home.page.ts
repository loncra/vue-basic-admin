import {ref} from 'vue'
import {
  type ActionAppApis,
  type ActionContext,
  defineCardGridPage,
  type RecordActionContext,
  type ToolbarActionContext,
} from '@loncra/antdv-pro'
import type {CarouselEntity, CarouselSavePayload} from '@/types/apis'
import {DATA_STATUS, getEnumValue, type TreeSortMetadata} from '@loncra/client/commons'
import i18n from '@/i18n'
import router from '@/routers'
import {renderIconFont} from '@/utils'
import {RESOURCE_SERVER_CAROUSEL_ROUTE} from '@/constants'
import {RESOURCE_SERVER_CAROUSEL_AUTHORITY} from '@loncra/client/resource'
import {CAROUSEL_TYPE_FILTER, carouselCore, carouselService} from './carousel.page'

export const carouselPreviewReloader = ref<(() => Promise<void>) | undefined>()

function unreleased(items: CarouselEntity[]) {
  return items.filter((item) => {
    const status = getEnumValue(item.status ?? 0)
    return status === DATA_STATUS.NEW || status === DATA_STATUS.REVOKE
  })
}

function released(items: CarouselEntity[]) {
  return items.filter((item) => getEnumValue(item.status ?? 0) === DATA_STATUS.RELEASE)
}

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

function addCarousel(ctx: ToolbarActionContext<CarouselEntity>): void {
  const type = (ctx.query as Record<string, unknown>)[CAROUSEL_TYPE_FILTER]
  void router.push({
    name: RESOURCE_SERVER_CAROUSEL_ROUTE.ADD,
    query: type == null ? undefined : {type: String(type)},
  })
}

function deleteUnreleased(ctx: ToolbarActionContext<CarouselEntity>): void {
  ctx.app.collection.remove(unreleased(ctx.selectedItems))
}

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

export const carouselHomePage = defineCardGridPage<CarouselSavePayload, CarouselEntity>(
  carouselCore,
  {
    authority: {
      add: RESOURCE_SERVER_CAROUSEL_AUTHORITY.SAVE,
      edit: RESOURCE_SERVER_CAROUSEL_AUTHORITY.SAVE,
      delete: RESOURCE_SERVER_CAROUSEL_AUTHORITY.DELETE,
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
      {
        id: 'edit',
        permission: RESOURCE_SERVER_CAROUSEL_AUTHORITY.GET,
        enabled: (ctx: RecordActionContext<CarouselEntity>) =>
          getEnumValue(ctx.record!.status ?? 0) !== DATA_STATUS.RELEASE,
        label: () => i18n.global.t('common.edit'),
        icon: () => renderIconFont('loncra-file-pen-line'),
      },
      {id: 'delete', visible: () => false},
    ],
    onDrop: ({sorts}, app) => sortCarousels(sorts, app),
  },
)
