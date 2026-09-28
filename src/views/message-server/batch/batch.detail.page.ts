import {h, ref, type VNodeChild} from 'vue'
import {Space, TypographyText} from 'antdv-next'
import {defineDetailPage, executeStatusCell} from '@loncra/antdv-pro'
import type {BatchMessageEntity} from '@loncra/client/message'
import {SiteMessageService} from '@loncra/client/message'
import {getEnumValue} from '@loncra/client/commons'
import i18n from '@/i18n'
import {batchCore} from './batch.page'

/** `a-descriptions` 的响应式列数（照抄旧页面 `Detail.vue`） */
const COLUMN = {xxxl: 2, xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1}

/**
 * 批次类型（照抄旧 `Detail.vue` 的三个字面量）：
 * 10 站内信 / 20 邮件 / 30 短信 —— 后端 `BatchMessageTypeEnum` 在 client 里只有枚举 id、没有值常量。
 * 导出给 `Detail.vue` 挑子表用（同一个判定，别写两处字面量）。
 */
export const BATCH_MESSAGE_TYPE = {SITE: 10, EMAIL: 20, SMS: 30} as const

const siteService = new SiteMessageService()

/**
 * 站内信的**已读数**：旧页面在 `postGetEntity` 里拉一次（`siteService.countRead`）给 `count` 那一项显示
 * ⇒ 声明内自持（`render` 里读它，跟着实体一起重算）。
 */
const readCount = ref(0)

/**
 * 批量消息详情（`Detail.vue`）。核心在 `batch.page.ts`，这里只写详情形态。
 *
 * 四处照旧：
 * - `type` 的显示靠核心字典的 `format: 'enum'`（= `getEnumName`）⇒ 不手写 `format`；
 * - **`executeStatus` 一律 `render: executeStatusCell()`**（状态点 + 状态名，全仓规矩，与列表同款）；
 * - `count` 那一项要拼「总数（成功, 失败）+ 站内信已读」⇒ `render`；
 * - 站内信已读数由 `postGetEntity` 拉（旧页面的 `siteService.countRead`）；
 * - 三张子表（短信 / 站内信 / 邮件）**不在声明里**：它们是 descriptions 之后的页面内容，
 *   由 `Detail.vue` 用 `#afterDescriptions` 插槽渲染（与旧页面同一个位置）。
 */
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
        // 站内信批次才有"已读"（旧页面写的是字面量 10）
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
