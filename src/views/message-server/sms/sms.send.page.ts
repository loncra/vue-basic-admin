import type {SmsMessageSendPayload, SmsSignEntity, SmsTemplateEntity} from '@loncra/client/message'
import {MESSAGE_SERVER_MESSAGE_TYPE_VALUE, SmsMessageService} from '@loncra/client/message'
import {type BasicIdMetadata, getEnumName, getEnumValue} from '@loncra/client/commons'
import {
  type CrudFormCore,
  defineFormPage,
  type PageFieldRenderContext,
  type UserSelectOption,
} from '@loncra/antdv-pro'
import {Tooltip, Typography} from 'antdv-next'
import {h} from 'vue'
import i18n from '@/i18n'
import {AuthServerService} from '@/apis'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME, YES_OR_NO_TYPE} from '@/constants'
import {smsCore} from './sms.page'

const smsMessageService = new SmsMessageService()

/**
 * 表单体类型 = 提交体 + `BasicIdMetadata` 那个形状。
 *
 * 与邮件发送页同一条原因：`CrudPageCore.TBody` 的约束是 `extends BasicIdMetadata<TId>`
 * （`{id?: T}`，全可选 ⇒ TypeScript 的**弱类型**），一个没有任何共同属性的提交体会被弱类型检查
 * 直接挡掉（TS2559）⇒ 交叉上它之后声明的形状才合法。本页永远不传 `id`（不取数、不编辑）。
 */
export type SmsSendForm = SmsMessageSendPayload & BasicIdMetadata<number>

/**
 * 壳从 `:context-extra` 递进来的两份**业务选项**。
 *
 * 模板 / 签名都是"按渠道取"的列表（`SmsTemplateService(channel).find()`），既不是枚举桶、
 * 也不是数据字典 ⇒ 走不了 `enumRef` / `dictId`。`fields.ts` 明说这条路：来源由壳从 `extra`
 * 递进来时就在 `props` 里给 options。**拉取时机归壳** —— 它同时要驱动"变量区"那块逃生块。
 */
interface SmsSendExtra extends Record<string, unknown> {
  smsTemplates: SmsTemplateEntity[]
  smsSigns: SmsSignEntity[]
}

/** `extra` 故意是 `Record<string, unknown>`（pro 不认它的内容）⇒ 声明侧自己收窄一次 */
const extraOf = (ctx: PageFieldRenderContext<SmsSendForm>) => ctx.extra as SmsSendExtra

const smsSendCore: CrudFormCore<SmsSendForm, SmsSendForm, number> = {
  // 与 sms.page.ts 那份核心共用两个字符串，不抄第二遍；**不给 service**（这页不取数）
  i18nPrefix: smsCore.i18nPrefix,
  routes: smsCore.routes,
}

/**
 * 短信**发送**页（`Send.vue`）的表单声明。
 *
 * 它不是实体的新增 / 编辑：提交体是 `SmsMessageSendPayload`，动作是 `send` 而不是 `save`
 * ⇒ 核心用 `CrudFormCore`（不给 `service`），提交写成 `submit`。
 *
 * **两处不在这里**（都是"宿主环境"或"pro 没有的能力"，由 `Send.vue` 承担）：
 * ① 成功之后去哪（`navigateAfterMessageSend`，`@success` 里接）；
 * ② **变量区**（内容预览 + 变量表）：pro 没有"表格式字段 / repeater"这个概念，
 *    `field.visible` 的上下文也拿不到实体（"选了模板才出现"表达不出来）⇒ 按既定口径走
 *    宿主自己的逃生，放在壳的 `default` 槽里画（位置与旧页一致：字段行之后、按钮之前）。
 *    因此 `content` / `metadata.variables` **不在这里声明**（值照旧在实体上、照旧进提交体）。
 */
export const smsSendFormPage = defineFormPage(smsSendCore, {
  /**
   * 实体初值 = 旧页 `options.form` 的那份（`type` 不在界面上，但提交体要它）。
   */
  createEntity: () => ({
    phoneNumbers: [],
    channel: 'alibabaCloud',
    type: MESSAGE_SERVER_MESSAGE_TYPE_VALUE.NOTICE,
    content: '',
    remark: '',
    metadata: {
      signCode: '',
      templateCode: '',
      variables: [],
    },
  }),
  /**
   * 字段顺序 = 旧页面顺序。
   *
   * 栅格：下面四个字段**不写 `col`** —— 旧页那四个 `a-col` 是 `xs/sm 24 + md~xxl 12`，
   * 与 pro 的默认断点（`FORM_FIELD_DEFAULT_COL`）**完全一致**；`remark` 与变量区在旧页是
   * `a-row` 之外的整宽行 ⇒ 显式 `span: 24`（变量区在壳的那个槽里，槽本身整宽）。
   */
  fields: [
    {
      key: 'channel',
      labelKey: 'common.channel',
      component: 'select',
      rules: [{required: true, trigger: 'change'}],
      // 选项来自枚举桶：pro 从这条 `enumRef` 收加载清单，下拉由内置 `select.mapOptions` 喂
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.CLOUD_CHANNEL_ENUM},
    },
    {
      // 点路径：数据不在顶层字段（`metadata` 那层）—— 写路径的字段**不查字段字典** ⇒ label 显式写
      key: 'metadata.templateCode',
      labelKey: 'messageServer.sms.template.code',
      component: 'select',
      rules: [{required: true, trigger: 'change'}],
      props: (ctx) => ({
        options: extraOf(ctx).smsTemplates,
        fieldNames: {label: 'name', value: 'id'},
      }),
    },
    {
      key: 'metadata.signCode',
      labelKey: 'messageServer.sms.sign.code',
      component: 'select',
      rules: [{required: true, trigger: 'change'}],
      props: (ctx) => ({
        options: extraOf(ctx).smsSigns,
        fieldNames: {label: 'name', value: 'id'},
      }),
    },
    {
      key: 'phoneNumbers',
      labelKey: 'common.phoneNumber',
      component: 'userSelect',
      rules: [{required: true, type: 'array', trigger: 'change'}],
      props: {mode: 'tags', query: {'filter_[phone_number_nen]': 'true'}},
      slots: {
        /**
         * 选项行：实名 + 手机号 + 校验徽标（旧 `Send.vue` 模板里那段，逻辑一字不改；
         * 与邮件发送页同一份写法，只把邮箱字段换成手机号字段）。
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
                name: `:${getEnumName(payload.phoneNumberVerified)}`,
              }),
            },
            {
              default: () =>
                h(
                  Typography.Text,
                  {
                    type:
                      getEnumValue(payload.phoneNumberVerified) === YES_OR_NO_TYPE.YES
                        ? 'success'
                        : 'warning',
                  },
                  {
                    default: () => [
                      AuthServerService.getPrincipalNameByUserDetails(payload),
                      `(${payload.phoneNumber})`,
                    ],
                  },
                ),
            },
          )
        },
      },
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
  submit: (entity) => smsMessageService.send(entity),
})
