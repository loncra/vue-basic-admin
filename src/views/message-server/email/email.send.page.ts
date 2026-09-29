import type {EmailMessageSendPayload} from '@loncra/client/message'
import {MESSAGE_SERVER_MESSAGE_TYPE_VALUE} from '@loncra/client/message'
import {type BasicIdMetadata, getEnumName, getEnumValue} from '@loncra/client/commons'
import {type CrudFormCore, defineFormPage, type UserSelectOption} from '@loncra/antdv-pro'
import {Tooltip, Typography} from 'antdv-next'
import {h} from 'vue'
import i18n from '@/i18n'
import {AuthServerService} from '@/apis'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME, YES_OR_NO_TYPE} from '@/constants'
import {emailCore, emailMessageService} from './email.page'

/**
 * 邮件**发送**页（`Send.vue`）的表单声明。
 *
 * 它不是实体的新增 / 编辑：提交体是 `EmailMessageSendPayload`（收件人多值、**没有 id**），
 * 提交动作是 `send` 而不是 `save` ⇒ 核心用 `CrudFormCore`（**不给 `service`**，这页不取数），
 * 提交写成 `submit`；`i18nPrefix` / `routes` 复用 `email.page.ts` 那份核心，不抄第二遍。
 *
 * 标题 / 提示 / 跳转都不在这里：成功提示由壳给（`result.message`），"发送成功去哪"由 `Send.vue`
 * 的 `@success` 接（`navigateAfterMessageSend` 认单条 / 批量两种返回形状）。
 */
/**
 * 表单体类型 = 提交体 + `BasicIdMetadata` 那个形状。
 *
 * ⚠️ **为什么要多带这一下**：`CrudPageCore.TBody` 的约束是 `extends BasicIdMetadata<TId>`
 * （就是 `{id?: T}`，全是可选属性 ⇒ TypeScript 的**弱类型**）。一个没有任何共同属性的类型
 * （`EmailMessageSendPayload` 正是：`toEmails` / `type` / `title` … 跟 `id` 毫不相干）会被弱类型
 * 检查直接挡掉（TS2559）⇒ 交叉上 `BasicIdMetadata` 之后声明的形状才合法。
 *
 * 本页永远不传 `id`（不取数、不编辑），这一位只是形状需要 —— 它不参与任何运行时逻辑。
 */
type EmailSendForm = EmailMessageSendPayload & BasicIdMetadata<number>

const emailSendCore: CrudFormCore<EmailSendForm, EmailSendForm, number> = {
  i18nPrefix: emailCore.i18nPrefix,
  routes: emailCore.routes,
}

export const emailSendFormPage = defineFormPage(emailSendCore, {
  createEntity: () => ({
    toEmails: [],
    type: MESSAGE_SERVER_MESSAGE_TYPE_VALUE.NOTICE,
    title: '',
    content: '',
    attachmentList: [],
    remark: '',
    metadata: {},
  }),
  /**
   * 字段顺序 = 旧页面顺序。两点与缺省不同：
   * - **一律 `col: {span: 24}`**：旧 `l-form` 没有栅格（单列），而 pro 的缺省是"平板起两列"，
   *   不写就变样了；
   * - **label 全部显式写**：这页的 `TBody` 是**提交体**、不是实体，核心那份 `fields` 字典对不上它。
   */
  fields: [
    {
      key: 'type',
      labelKey: 'common.type',
      component: 'select',
      col: {span: 24},
      // 选项由 pro 自己拉（`collectFormSources` 收这条 `enumRef`）⇒ 不再需要 `loadMessageSendEnums()`
      enumRef: {module: SYSTEM_MODULE_NAME.MESSAGE_SERVER, id: SYSTEM_ENUM_TYPE.MESSAGE_TYPE_ENUM},
    },
    {
      key: 'toEmails',
      labelKey: 'common.email',
      component: 'userSelect',
      col: {span: 24},
      rules: [{required: true, type: 'array', trigger: 'change'}],
      props: {mode: 'tags', query: {'filter_[email_nen]': 'true'}},
      slots: {
        /**
         * 选项行：实名 + 邮箱 + 校验徽标（旧 `Send.vue` 模板里那段，逻辑一字不改）。
         * 后端带了 `payload`（`PlatformUser`）才有这些；自由输入的 tag 退回 label。
         */
        optionRender: ({option}: {option: UserSelectOption}) => {
          const payload = option.data?.payload
          if (!payload) {
            return option.data?.label
          }
          return h(
            Tooltip,
            {
              title: i18n.global.t('common.verified', {
                name: `:${getEnumName(payload.emailVerified)}`,
              }),
            },
            {
              default: () =>
                h(
                  Typography.Text,
                  {
                    type:
                      getEnumValue(payload.emailVerified) === YES_OR_NO_TYPE.YES
                        ? 'success'
                        : 'warning',
                  },
                  {
                    default: () => [
                      AuthServerService.getPrincipalNameByUserDetails(payload),
                      `(${payload.email})`,
                    ],
                  },
                ),
            },
          )
        },
      },
    },
    {
      key: 'title',
      labelKey: 'common.title',
      component: 'input',
      col: {span: 24},
      rules: [{required: true, trigger: 'change'}],
    },
    {
      key: 'content',
      labelKey: 'common.content',
      component: 'editor',
      col: {span: 24},
      rules: [{required: true, trigger: 'change'}],
    },
    {
      key: 'attachmentList',
      labelKey: 'attachment.text',
      component: 'attachmentUpload',
      col: {span: 24},
      // 上传由壳的 `beforeSubmit` 自动做（旧页面手写的 `ref.upload()` 那一步没了）
      props: {mode: 'dragger'},
    },
    {
      key: 'remark',
      labelKey: 'common.remark',
      component: 'textarea',
      col: {span: 24},
      props: {autoSize: {minRows: 5, maxRows: 10}},
    },
  ],
  // 提交动作是"发送"，不是 CRUD 的"保存"（`service` 也不需要：这页不取数）
  submit: (entity) => emailMessageService.send(entity),
})
