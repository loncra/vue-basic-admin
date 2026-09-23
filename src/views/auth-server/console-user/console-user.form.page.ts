import type {ConsoleUserEntity, ConsoleUserSavePayload} from '@loncra/client/auth'
import {AUTH_SERVER_GENDER} from '@loncra/client/auth'
import {defineFormPage} from '@loncra/antdv-pro'
import {VALID_REGX} from '@/constants'
import {consoleUserCore} from './console-user.page'

/**
 * 控制台用户新增/编辑（`Form.vue`）。核心在 `console-user.page.ts`，这里只写表单形态。
 *
 * 说明：
 * - 性别/状态的选项来自枚举桶（字典里的 `enumId`），壳不用再自己拉 `getServiceEnumerates`；
 * - 编辑态禁用与 `email` 规则的差异都靠函数形态读 `ctx.entity`；
 * - 「角色 + 独立资源」两个选择器是壳里的逃生内容（默认插槽），它们的勾选写回 `roleIds` / `resourceIds`
 *   —— 这两个不在表单字段里，所以重置要在 `onReset` 里清掉。
 */
export const consoleUserFormPage = defineFormPage<ConsoleUserSavePayload, ConsoleUserEntity>(
  consoleUserCore,
  {
    createEntity: () => ({
      // `id` / `version` 必须有**占位键**：`BasicForm.getEntity` 只按「初值里已有的键」把服务端数据写回实体，
      // 少了它们，编辑态 `entity.id` 永远 undefined（disabled 规则、email 规则、编辑态标题全会失效）。
      id: null as unknown as number,
      version: null as unknown as number,
      realName: '',
      gender: AUTH_SERVER_GENDER.UNKNOWN,
      phoneNumber: '',
      remark: '',
      email: '',
      username: '',
      status: 1,
      phoneNumberVerified: 0,
      emailVerified: 0,
      systemName: '',
    }),
    fields: [
      {key: 'realName', component: 'input', span: 12, rules: [{required: true}]},
      {
        key: 'username',
        component: 'input',
        span: 12,
        rules: [{required: true}],
        props: (ctx) => ({disabled: Boolean(ctx.entity?.id)}),
      },
      {
        key: 'email',
        component: 'input',
        span: 12,
        // 新增要校验邮箱格式，编辑不让改邮箱 ⇒ 也不用校验
        rules: (ctx) => (ctx.entity?.id ? [] : [{type: 'email'}]),
        props: (ctx) => ({disabled: Boolean(ctx.entity?.id)}),
      },
      {
        key: 'phoneNumber',
        component: 'input',
        span: 12,
        rules: (ctx) => [
          {type: 'string', pattern: VALID_REGX.PHONE_NUMBER, message: ctx.t('error.valid.phoneNumber')},
        ],
        props: (ctx) => ({disabled: Boolean(ctx.entity?.id)}),
      },
      {key: 'gender', component: 'select', span: 12},
      {key: 'status', component: 'select', span: 12},
    ],
    // 标题不在这里：`titleText` 没进 pro（"怎么写标题"是宿主的事）⇒ 在 `Form.vue` 的
    // `useEntityPageTitle` 里拼（编辑态带 `(realName)`，与旧行为一致）。
    onReset: (ctx) => {
      const entity = ctx.entity?.value
      if (entity) {
        entity.resourceIds = []
        entity.roleIds = []
      }
    },
  },
)
