import {CarouselService} from '@loncra/client/resource'
import type {CrudPageCore} from '@loncra/antdv-pro'
import type {CarouselEntity, CarouselSavePayload} from '@/types/apis'
import {RESOURCE_SERVER_CAROUSEL_ROUTE} from '@/constants'
import {
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME
} from '@loncra/client/commons'

export const carouselService = new CarouselService()

export const CAROUSEL_TYPE_FILTER = 'filter_[type_eq]'

export const carouselCore: CrudPageCore<CarouselSavePayload, CarouselEntity> = {
  service: carouselService,
  i18nPrefix: 'resourceServer.carousel',
  routes: {
    home: RESOURCE_SERVER_CAROUSEL_ROUTE.HOME,
    edit: RESOURCE_SERVER_CAROUSEL_ROUTE.EDIT,
    add: RESOURCE_SERVER_CAROUSEL_ROUTE.ADD,
  },

  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.CAROUSEL,

  fields: {
    cover: {labelKey: 'resourceServer.carousel.image'},
    name: {labelKey: 'common.name'},
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
