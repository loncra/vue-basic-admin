import type {BasicIdMetadata} from '@loncra/client/commons'
import type {SiteMessageSendPayload} from '@loncra/client/message'
import {MESSAGE_SERVER_MESSAGE_TYPE_VALUE} from '@loncra/client/message'
import {type CrudFormCore, defineFormPage, type UserSelectOption} from '@loncra/antdv-pro'
import {Select, SpaceAddon, SpaceCompact, Switch, Typography} from 'antdv-next'
import {h, shallowRef} from 'vue'
import i18n from '@/i18n'
import {AuthServerService} from '@/apis'
import {SYSTEM_ENUM_TYPE, SYSTEM_MODULE_NAME, YES_OR_NO_TYPE} from '@/constants'
import {siteCore, siteMessageService} from './site.page'

/**
 * 表单体类型 = 提交体 + `BasicIdMetadata` 那个形状。
 *
 * 与前两页同一条原因：`CrudPageCore.TBody` 的约束是 `extends BasicIdMetadata<TId>`（全可选 ⇒
 * TypeScript 的**弱类型**），没有任何共同属性的提交体会被弱类型检查挡掉（TS2559）⇒ 交叉上它才合法。
 * 本页永远不传 `id`。
 */
export type SiteSendForm = SiteMessageSendPayload & BasicIdMetadata<number>

/**
 * 当前实体（**声明级插槽**的补丁）。
 *
 * `PageFormFieldSlots` 的签名是 `(...args: never[]) => VNodeChild` —— 插槽函数拿不到 `ctx`，
 * 而封面那两个插槽要显示 `title` / `content`（旧页 `#itemTitle` / `#itemDescription`）。
 * ⇒ 用 `preMounted` 把壳里那个实体 Ref 记住，插槽读它（`shallowRef` + 响应式实体 ⇒ 表单里一改就跟着变）。
 */
const formEntity = shallowRef<SiteSendForm>()

const siteSendCore: CrudFormCore<SiteSendForm, SiteSendForm, number> = {
  // 与 site.page.ts 那份核心共用两个字符串；**不给 service**（这页不取数）
  i18nPrefix: siteCore.i18nPrefix,
  routes: siteCore.routes,
}

/**
 * 站内信**发送**页（`Send.vue`）的表单声明。
 *
 * 与邮件 / 短信两页同一套：核心用 `CrudFormCore`（不给 `service`）、提交写成 `submit`；
 * "成功之后去哪"由 `Send.vue` 的 `@success` 接（`navigateAfterMessageSend`，与邮件页同款）。
 *
 * **提交 = `siteMessageService.send(entity)`**：这是恢复旧页 `doSubmit` 里被注释掉的那三行
 * （发送 → 按返回形状跳列表 / 批次明细 → 成功提示）。两个附件由字段的 `beforeSubmit` 先上传完，
 * 所以这里只管"把提交体发出去"。
 */
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
  // 给上面的两个插槽记住实体（第一个渲染发生在 `preMounted` 之前 ⇒ 先渲染成空，拿到后自动补上）
  preMounted: (ctx) => {
    formEntity.value = ctx.entity.value
  },
  /**
   * 字段顺序 = 旧页面顺序。栅格：`type` / `channels` 不写 `col`（旧页是 `md` 起两列 = pro 默认断点），
   * 其余都在旧页的 `a-row` 之外（整宽）⇒ `span: 24`。
   */
  fields: [
    {
      // 封面：值是**一张** `ObjectWriteResult`；上传由字段的 `beforeSubmit` 自动做（旧页手写的两个 ref 没了）
      key: 'cover',
      // 旧页这条 form-item **没有 label**（只有旧 kit 的 `:message-variables`，那是校验消息变量不是标签）
      // ⇒ `label: false` 复刻；「封面」文案照旧在 `uploadDescription` 插槽里显示
      label: false,
      component: 'attachmentUpload',
      col: {span: 24},
      props: {
        mode: 'picture-card',
        accept: '.jpg,.jpeg,.png',
        maxCount: 1,
        multiple: false,
        // 旧页那三行外观类照搬（尺寸是业务定的，不是 pro 的默认样式）
        classes: {
          item: 'w-[425px] h-[225px]',
          list: 'w-full justify-center',
          meta: 'w-[425px] mt-xxs max-w-full min-w-0',
        },
      },
      slots: {
        // 封面卡的标题 / 正文预览用**同一份表单里的标题与正文**（旧页 `#itemTitle` / `#itemDescription`）
        itemTitle: () =>
          h(Typography.Text, {ellipsis: true}, {default: () => formEntity.value?.title}),
        uploadDescription: () => i18n.global.t('common.cover'),
        itemDescription: () =>
          h(
            Typography.Paragraph,
            {class: 'm-0', type: 'secondary', ellipsis: {rows: 3}},
            {default: () => (formEntity.value?.content ?? '').replace(/<[^>]*>/g, '')},
          ),
      },
    },
    {
      key: 'type',
      labelKey: 'common.type',
      component: 'select',
      // 选项来自枚举桶（旧页 `loadMessageSendEnums().typeOptions`）⇒ pro 自己拉，不用壳递
      enumRef: {module: SYSTEM_MODULE_NAME.MESSAGE_SERVER, id: SYSTEM_ENUM_TYPE.MESSAGE_TYPE_ENUM},
    },
    {
      /**
       * 渠道 + 启用开关：**一个 form-item 里两个控件**（旧页 `a-space-compact` 把多选下拉与
       * `a-switch` 拼成一行）⇒ pro 没有这种复合控件，走**字段级 `render` 逃生**。
       *
       * `render` 字段的规矩（`PageFormField.render` 的说明）：**控件整个由宿主实例化** ——
       * 取值 / 回写自己接（直接改 `ctx.entity`，这是宿主代码）；`label` / 栅格 / 校验仍归 DSL
       * （所以下面 `rules` 的"开关开着才必填"照样生效）。
       *
       * **来源照旧只写一处**：`enumRef` 写在这里，pro 统一收清单、连同 `type` 那个桶一次请求
       * （同一 module 会并成一条）；逃生从字段级 ctx 的 `ctx.buckets` 取**同一份**结果自己喂控件
       * ⇒ 壳里不需要再拉一次（同一份桶两处请求 = 不规范）。
       */
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
                // 开关关着 = 这个下拉没用（旧页 `:disabled` 同款）
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
        /** 选项行：实名（后端带了 `payload`）或退回 label —— 旧页这段没有校验徽标，照搬 */
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
