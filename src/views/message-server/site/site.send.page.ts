import type {BasicIdMetadata} from '@loncra/client/commons'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME, YES_OR_NO_TYPE} from '@loncra/client/commons'
import type {SiteMessageSendPayload} from '@loncra/client/message'
import {MESSAGE_SERVER_MESSAGE_TYPE_VALUE} from '@loncra/client/message'
import {
  type CrudFormCore,
  defineFormPage,
  type PageFieldRenderContext,
  type UserSelectOption,
} from '@loncra/antdv-pro'
import {Select, SpaceAddon, SpaceCompact, Switch, Typography} from 'antdv-next'
import {h} from 'vue'
import i18n from '@/i18n'
import {AuthServerService} from '@loncra/client/auth'
import {siteCore, siteMessageService} from './site.page'

export type SiteSendForm = SiteMessageSendPayload & BasicIdMetadata<number>

const siteSendCore: CrudFormCore<SiteSendForm, SiteSendForm, number> = {
  i18nPrefix: siteCore.i18nPrefix,
  routes: siteCore.routes,
}

export const siteSendFormPage = defineFormPage(siteSendCore, {
  createEntity: () => ({
    toUsers: [],
    type: MESSAGE_SERVER_MESSAGE_TYPE_VALUE.NOTICE,
    content: '',
    title: '',
    pushable: YES_OR_NO_TYPE.YES,
    channels: [],
    attachmentList: [],
    remark: '',
    metadata: {},
  }),
  fields: [
    {
      key: 'cover',
      label: false,
      component: 'attachmentUpload',
      col: {span: 24},
      props: {
        mode: 'picture-card',
        accept: '.jpg,.jpeg,.png',
        maxCount: 1,
        multiple: false,
        classes: {
          item: 'w-[425px] h-[225px]',
          list: 'w-full justify-center',
          meta: 'w-[425px] mt-xxs max-w-full min-w-0',
        },
      },
      slots: {
        itemTitle: (_file: unknown, ctx: PageFieldRenderContext<SiteSendForm>) =>
          h(Typography.Text, {ellipsis: true}, {default: () => ctx.entity.title}),
        uploadDescription: () => i18n.global.t('common.cover'),
        itemDescription: (_file: unknown, ctx: PageFieldRenderContext<SiteSendForm>) =>
          h(
            Typography.Paragraph,
            {class: 'm-0', type: 'secondary', ellipsis: {rows: 3}},
            {default: () => (ctx.entity.content ?? '').replace(/<[^>]*>/g, '')},
          ),
      },
    },
    {
      key: 'type',
      labelKey: 'common.type',
      component: 'select',
      enumRef: {module: SYSTEM_MODULE_NAME.MESSAGE_SERVER, id: SYSTEM_ENUM_TYPE.MESSAGE_TYPE_ENUM},
    },
    {
      key: 'channels',
      labelKey: 'messageServer.site.channel',
      enumRef: {
        module: SYSTEM_MODULE_NAME.MESSAGE_SERVER,
        id: SYSTEM_ENUM_TYPE.SITE_MESSAGE_PUSHABLE_CHANNEL_ENUM,
      },
      rules: (ctx) =>
        ctx.entity.pushable === YES_OR_NO_TYPE.YES
          ? [{required: true, trigger: 'change'}]
          : undefined,
      render: (ctx) =>
        h(
          SpaceCompact,
          {block: true},
          {
            default: () => [
              h(Select, {
                mode: 'multiple',
                disabled: ctx.entity.pushable !== YES_OR_NO_TYPE.YES,
                options:
                  ctx.buckets[SYSTEM_MODULE_NAME.MESSAGE_SERVER]?.[
                    SYSTEM_ENUM_TYPE.SITE_MESSAGE_PUSHABLE_CHANNEL_ENUM
                  ] ?? [],
                fieldNames: {label: 'name'},
                value: ctx.entity.channels,
                'onUpdate:value': (value: unknown) => {
                  ctx.entity.channels = value as SiteSendForm['channels']
                },
              }),
              h(SpaceAddon, {}, {
                default: () =>
                  h(Switch, {
                    checkedValue: YES_OR_NO_TYPE.YES,
                    unCheckedValue: YES_OR_NO_TYPE.NO,
                    checkedChildren: ctx.t('common.enabled'),
                    unCheckedChildren: ctx.t('common.disabled'),
                    value: ctx.entity.pushable,
                    'onUpdate:value': (value: unknown) => {
                      ctx.entity.pushable = value as SiteSendForm['pushable']
                    },
                  }),
              }),
            ],
          },
        ),
    },
    {
      key: 'toUsers',
      labelKey: 'auth.principal',
      component: 'userSelect',
      col: {span: 24},
      rules: [{required: true, type: 'array', trigger: 'change'}],
      props: {mode: 'multiple'},
      slots: {
        optionRender: ({option}: {option: UserSelectOption}) => {
          const payload = option.data?.payload
          return payload ? AuthServerService.getPrincipalNameByUserDetails(payload) : option.data?.label
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
  submit: (entity) => siteMessageService.send(entity),
})
