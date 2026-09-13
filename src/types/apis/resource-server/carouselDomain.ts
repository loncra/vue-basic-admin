import type {Dayjs} from 'dayjs'
import type {
  CarouselEntity as ClientCarouselEntity,
  CarouselSavePayload as ClientCarouselSavePayload,
} from '@loncra/client/resource'

export interface CarouselSavePayload
  extends Omit<ClientCarouselSavePayload, 'expirationTime' | 'showtime'> {
  expirationTime?: number | Dayjs
  showtime?: number | Dayjs
}

export interface CarouselEntity
  extends Omit<ClientCarouselEntity, 'expirationTime' | 'showtime'>,
    CarouselSavePayload {}
