import {h} from 'vue'
import type {TableProps} from 'antdv-next'
import type {EnterpriseInvitationSavePayload} from '@loncra/client/auth'
import {AUTH_SERVER_AUDIT_TYPE_VALUE} from '@loncra/client/auth'
import {CrudHomePage, defineFormPage, type PageFieldRenderContext} from '@loncra/antdv-pro'
import {DATE_TIME_FORMAT} from '@/constants'
import {enterpriseRoleHomePage} from '@/views/auth-server/enterprise-role/enterprise-role.home.page'
import {enterpriseInvitationCore} from './enterprise-invitation.page'

/** 发起邀请的空表单：`expirationTime` 空 = 永久、审核类型默认「自动审核」、角色为空 */
export function createEmptyForm(): EnterpriseInvitationSavePayload {
  return {
    id: null as unknown as number,
    expirationTime: null as unknown as number,
    auditType: AUTH_SERVER_AUDIT_TYPE_VALUE.AUTOMATIC,
    roleIds: [],
  }
}

/**
 * 发起邀请的**表单形态**（`Form.vue` 那个弹层）。核心在
 * `enterprise-invitation.page.ts`，这里只写表单形态 —— 与其它页面的 `.form.page.ts` 同一个形态
 * （弹层壳 `CrudFormModal` 吃的就是它）。
 *
 * 三处要点：
 * - `expirationTime` / `auditType` 走**前两列**（各 12 栅格 = 旧页 `#rowLayout` 里那两个 `a-col`；
 *   正好是 pro 的默认栅格 `FORM_FIELD_DEFAULT_COL`，所以不必写 `col`）；
 * - **「审核类型」的 options 由声明的 `enumRef` 自己拉**（核心字典里那条，
 *   module 是 **resource-server**）⇒ 宿主那个 `auditTypeOptions` prop 与两处 `computed` 因此删掉
 *   （旧壳 `l-modal-form` 拉不到来源，才要宿主把列表的桶算好递进来）；
 * - **`roleIds` 的控件就是那张角色表**（见下面 `render` 的说明），它是**必填**（旧页那条 `:rules`）。
 */
export const enterpriseInvitationFormPage = defineFormPage(enterpriseInvitationCore, {
  createEntity: createEmptyForm,
  fields: [
    {
      key: 'expirationTime',
      component: 'date',
      props: {
        // 与旧页一致：值就是提交用的时间戳（`POST_TIMESTAMP_FORMAT`）、带时间、可清空
        valueFormat: DATE_TIME_FORMAT.POST_TIMESTAMP_FORMAT,
        showTime: true,
        allowClear: true,
        class: 'w-full',
      },
    },
    {key: 'auditType', component: 'select', props: {class: 'w-full'}},
    {
      key: 'roleIds',
      col: {span: 24},
      rules: [{required: true, type: 'array'}],
      /**
       * 角色表：**这个字段的控件就是那张表** —— `render` 逃生画 pro 的角色列表声明
       * （`plain` + `:title="false"` + `:record-actions="false"`，= 旧组件的 `preview`：只挑选、不给行操作），
       * 勾选回写 `ctx.entity.roleIds`（旧页同一段）。
       *
       * ⚠️ 为什么不用弹层壳的 `default` 槽：槽渲染在**所有字段之后** ⇒ 会把这张表挤到「备注」下面 ✗；
       * 放在字段的 `render` 里既保住顺序（过期时间/审核类型 → 角色 → 副标题 → 备注），
       * 又保住旧页那条 `required` 校验（`a-form-item` 仍包着它）。
       */
      render: (ctx: PageFieldRenderContext<EnterpriseInvitationSavePayload>) =>
        h(CrudHomePage as never, {
          page: enterpriseRoleHomePage,
          plain: true,
          title: false,
          recordActions: false,
          query: {'filter_[enabled_eq]': '1'},
          rowSelection: {
            type: 'checkbox',
            fixed: true,
            selectedRowKeys: ctx.entity.roleIds,
            onChange: ((keys: unknown[]) => {
              ctx.entity.roleIds = keys as number[]
            }) as NonNullable<TableProps['rowSelection']>['onChange'],
          },
        }),
    },
    {
      key: 'subTitle',
      component: 'textarea',
      col: {span: 24},
      props: {rows: 4, showCount: true, maxlength: 256},
    },
    {
      key: 'remark',
      component: 'textarea',
      col: {span: 24},
      props: {rows: 4, showCount: true, maxlength: 256},
    },
  ],
})
