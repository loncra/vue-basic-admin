import type {EmailMessageSendPayload} from '@loncra/client/message'
import {MESSAGE_SERVER_MESSAGE_TYPE_VALUE} from '@loncra/client/message'
import {
  type BasicIdMetadata,
  getEnumName,
  getEnumValue,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
  YES_OR_NO_TYPE
} from '@loncra/client/commons'
import {type CrudFormCore, defineFormPage, type UserSelectOption} from '@loncra/antdv-pro'
import {Tooltip, Typography} from 'antdv-next'
import {h} from 'vue'
import i18n from '@/i18n'
import {AuthServerService} from '@loncra/client/auth'
import {emailCore, emailMessageService} from './email.page'

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
  fields: [
    {
      key: 'type',
      labelKey: 'common.type',
      component: 'select',
      col: {span: 24},
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
  submit: (entity) => emailMessageService.send(entity),
})
