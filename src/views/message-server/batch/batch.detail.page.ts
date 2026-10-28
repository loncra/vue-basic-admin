import {h, ref, type VNodeChild} from 'vue'
import {Space, TypographyText} from 'antdv-next'
import {defineDetailPage, executeStatusCell} from '@loncra/antdv-pro'
import type {BatchMessageEntity} from '@loncra/client/message'
import {SiteMessageService} from '@loncra/client/message'
import {getEnumValue} from '@loncra/client/commons'
import i18n from '@/i18n'
import {batchCore} from './batch.page'

const COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}

export const BATCH_MESSAGE_TYPE = {SITE: 10, EMAIL: 20, SMS: 30} as const

const siteService = new SiteMessageService()

const readCount = ref(0)

export const batchDetailPage = defineDetailPage(batchCore, {
  column: COLUMN,
  fields: [
    'type',
    {key: 'executeStatus', render: executeStatusCell()},
    'creationTime',
    'completeTime',
    {
      key: 'count',
      render: (_value, entity: BatchMessageEntity) => {
        const children: VNodeChild[] = [
          String(entity.count ?? ''),
          h('span', null, [
            '(',
            h(
              TypographyText,
              {type: 'success'},
              {
                default: () =>
                  i18n.global.t('messageServer.batch.successNumber', {
                    count: `:${entity.successNumber ?? 0}`,
                  }),
              },
            ),
            ',',
            h(
              TypographyText,
              {type: 'danger'},
              {
                default: () =>
                  i18n.global.t('messageServer.batch.failNumber', {
                    count: `:${entity.failNumber ?? 0}`,
                  }),
              },
            ),
            ')',
          ]),
        ]
        if (getEnumValue(entity.type) === BATCH_MESSAGE_TYPE.SITE) {
          children.push(
            i18n.global.t('messageServer.site.readCount', {count: `:${readCount.value}`}),
          )
        }
        return h(Space, null, {default: () => children})
      },
    },
  ],
  postGetEntity: async (entity) => {
    const result = await siteService.countRead(Number(entity.id))
    readCount.value = result?.data ?? 0
    return entity
  },
})
