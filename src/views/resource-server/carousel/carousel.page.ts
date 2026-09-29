import {CarouselService} from '@loncra/client/resource'
import type {CrudPageCore} from '@loncra/antdv-pro'
import type {CarouselEntity, CarouselSavePayload} from '@/types/apis'
import {
  OPERATION_DATA_TRACE_TABLE,
  RESOURCE_SERVER_CAROUSEL_ROUTE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'

/**
 * 页面 service。声明用它取数；旧 `Form.vue` 里那个 `new CarouselService()` 收进来一处写。
 */
export const carouselService = new CarouselService()

/**
 * "按类型过滤"的查询名：**列表（每个 tab 一个网格）**与**声明里的"新增"动作**都要用它
 * （动作要从当前网格的 query 里把类型取出来带给新增页）⇒ 跨文件共用一个常量，不重复写字面量。
 */
export const CAROUSEL_TYPE_FILTER = 'filter_[type_eq]'

/**
 * 轮播图的**核心**：service / i18nPrefix / routes / 字段字典只写一次。
 *
 * 形态目前只有 Form（`carousel.form.page.ts`）—— 列表 `Home.vue` 还没迁声明式，
 * 等它迁的时候把 `home` 形态接在这个 core 上即可。
 *
 * 类型用**宿主**的 `CarouselSavePayload` / `CarouselEntity`（`@/types/apis`）：它们把
 * `showtime` / `expirationTime` 放宽成 `number | Dayjs`（旧页面 `postGetEntity` 会把它们换成 dayjs）✓
 */
export const carouselCore: CrudPageCore<CarouselSavePayload, CarouselEntity> = {
  service: carouselService,
  i18nPrefix: 'resourceServer.carousel',
  routes: {home: RESOURCE_SERVER_CAROUSEL_ROUTE.HOME},

  /** 操作记录（旧 Form 传过 `OPERATION_DATA_TRACE_TABLE.CAROUSEL` ⇒ 收进 core） */
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.CAROUSEL,

  /** 字段字典：labelKey / format / enumRef 只写一次 */
  fields: {
    cover: {labelKey: 'resourceServer.carousel.image'},
    name: {labelKey: 'common.name'},
    // 类型：后端 `CarouselTypeEnum`（resource-server）
    type: {
      labelKey: 'common.type',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.RESOURCE_SERVER,
        id: SYSTEM_ENUM_TYPE.CAROUSEL_TYPE_ENUM,
      },
    },
    showtime: {labelKey: 'resourceServer.carousel.showtime'},
    expirationTime: {labelKey: 'common.expiresTime'},
    link: {labelKey: 'common.link'},
    remark: {labelKey: 'common.remark'},
  },
}
