import {h, ref} from 'vue'
import dayjs, {type Dayjs} from 'dayjs'
import type {ObjectWriteResult} from '@loncra/client/resource'
import {RESOURCE_SERVER_CAROUSEL_TYPE} from '@loncra/client/resource'
import {
  ATTACHMENT_UPLOAD_MODE,
  AttachmentUpload,
  defineFormPage,
  disableDate,
  disableTime,
} from '@loncra/antdv-pro'
import {DATE_TIME_FORMAT} from '@/constants'
import {carouselCore} from './carousel.page'

const coverUploadRef = ref<{upload: () => Promise<ObjectWriteResult | undefined>}>()

export const carouselFormPage = defineFormPage(carouselCore, {
  createEntity: () => ({
    name: '',
    type: RESOURCE_SERVER_CAROUSEL_TYPE.PC,
    link: {
      id: 'http://',
      value: '',
    },
    cover: null as unknown as ObjectWriteResult,
    remark: '',
    version: null as unknown as number,
    id: null as unknown as number,
    expirationTime: null as unknown as Dayjs,
    showtime: null as unknown as Dayjs,
  }),
  fields: [
    {
      key: 'cover',
      col: {span: 24},
      rules: [{required: true, trigger: 'change'}],
      render: (ctx) =>
        h(AttachmentUpload, {
          ref: coverUploadRef,
          maxCount: 1,
          multiple: false,
          mode: ATTACHMENT_UPLOAD_MODE.DRAGGER,
          value: ctx.entity.cover,
          'onUpdate:value': (value: unknown) => {
            ctx.entity.cover = value as ObjectWriteResult
          },
        }),
    },
    {key: 'name', component: 'input', rules: [{required: true, trigger: 'change'}]},
    {key: 'type', component: 'select'},
    {
      key: 'showtime',
      component: 'date',
      props: () => ({
        class: 'w-full',
        showTime: true,
        valueFormat: DATE_TIME_FORMAT.POST_TIMESTAMP_FORMAT,
      }),
    },
    {
      key: 'expirationTime',
      component: 'date',
      props: (ctx) => ({
        class: 'w-full',
        showTime: true,
        valueFormat: DATE_TIME_FORMAT.POST_TIMESTAMP_FORMAT,
        disabledDate: (value: Dayjs) => disableDate(value, ctx.entity.showtime as Dayjs),
        disabledTime: (current: Dayjs | null) =>
          disableTime(current, ctx.entity.showtime as Dayjs),
      }),
    },
  ],
  preMounted: (ctx) => {
    const initialType = ctx.extra.initialType as number | string | undefined
    if (initialType !== undefined && initialType !== '') {
      ctx.entity.value.type = Number(initialType)
    }
  },
  postGetEntity: (entity) => {
    if (entity.showtime) {
      entity.showtime = dayjs(entity.showtime as Dayjs)
    }
    if (entity.expirationTime) {
      entity.expirationTime = dayjs(entity.expirationTime as Dayjs)
    }
    return entity
  },
  preSubmit: async () => {
    await coverUploadRef.value?.upload()
  },
})
