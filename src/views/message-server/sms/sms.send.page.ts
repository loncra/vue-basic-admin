import type {SmsMessageSendPayload, SmsSignEntity, SmsTemplateEntity} from '@loncra/client/message'
import {MESSAGE_SERVER_MESSAGE_TYPE_VALUE, SmsMessageService} from '@loncra/client/message'
import {
  type BasicIdMetadata,
  getEnumName,
  getEnumValue,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
  YES_OR_NO_TYPE
} from '@loncra/client/commons'
import {
  type CrudFormCore,
  defineFormPage,
  type PageFieldRenderContext,
  type UserSelectOption,
} from '@loncra/antdv-pro'
import {Tooltip, Typography} from 'antdv-next'
import {h} from 'vue'
import i18n from '@/i18n'
import {AuthServerService} from '@loncra/client/auth'
import {smsCore} from './sms.page'

const smsMessageService = new SmsMessageService()

export type SmsSendForm = SmsMessageSendPayload & BasicIdMetadata<number>

interface SmsSendExtra extends Record<string, unknown> {
  smsTemplates: SmsTemplateEntity[]
  smsSigns: SmsSignEntity[]
}

const extraOf = (ctx: PageFieldRenderContext<SmsSendForm>) => ctx.extra as SmsSendExtra

const smsSendCore: CrudFormCore<SmsSendForm, SmsSendForm, number> = {
  i18nPrefix: smsCore.i18nPrefix,
  routes: smsCore.routes,
}

export const smsSendFormPage = defineFormPage(smsSendCore, {
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
  fields: [
    {
      key: 'channel',
      labelKey: 'common.channel',
      component: 'select',
      rules: [{required: true, trigger: 'change'}],
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.CLOUD_CHANNEL_ENUM},
    },
    {
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
  submit: (entity) => smsMessageService.send(entity),
})
