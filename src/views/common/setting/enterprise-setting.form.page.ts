import type {EnterpriseEntity, EnterprisePayload} from '@loncra/client/auth'
import {EnterpriseService} from '@loncra/client/auth'
import {type CrudFormCore, defineFormPage} from '@loncra/antdv-pro'
import {ICON_SELECT_MODE, OPERATION_DATA_TRACE_TABLE} from '@/constants'
import {renderIconFont} from '@/utils'

/**
 * 企业设置的 service：「新增 / 编辑」弹层与「解散 / 退出」（`EnterpriseSetting.vue` 里）共用
 * ⇒ 只 `new` 一次，两处 import 同一份。
 *
 * ✅ 顶层 `new` 现在是**安全的**（2026-09-30 service 层治根）：`new XxxService()` 不再在构造期
 * 解析 URL（`DetailSearchRestfulService` 收的是取值函数，请求时才求值）⇒ 与另外 14 份声明
 * **同一个形状**，不必再靠工厂绕开。
 * （历史：它一度落进首屏 eager 图 —— `routers/index.ts` 当年静态 import 过
 * `views/common/Setting.vue`；同一天稍后路由侧也统一改成按需加载，见 `routers/index.ts` 顶部说明。）
 */
export const enterpriseSettingService = new EnterpriseService()

/**
 * 企业设置的**核心**：service / i18n / 字段字典 / 操作轨迹 target 只写一次。
 *
 * 不写 `routes`：这个弹层不在路由上（它是「设置」页里的弹层，`EnterpriseSetting.vue` 渲染）。
 */
export const enterpriseSettingCore: CrudFormCore<EnterprisePayload, EnterpriseEntity> = {
  service: enterpriseSettingService,
  i18nPrefix: 'systemSetting.enterprise',
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.ENTERPRISE,
  fields: {
    name: {labelKey: 'common.name'},
    icon: {labelKey: 'common.icon'},
    remark: {labelKey: 'common.remark'},
  },
}

/**
 * 企业设置的新增 / 编辑弹层（`EnterpriseSetting.vue`）。三处照旧：
 *
 * - `name` 必填（旧页那条 `:rules`）；
 * - `icon` 走注册表内置的 `iconSelect`、**头像模式**（与列表上那个 `preview` 的 `IconSelect`
 *   同一口径：`ICON_SELECT_MODE.AVATAR` + 宿主的 `renderIconFont`）。
 *   ⚠️ **不传 `options`** —— 老壳那份 `iconOptions` 一直是个空数组、且从没有地方加载过，
 *   avatar 模式本来也不列图标 ⇒ 照搬"没有选项"这个事实，不凭空造一份；
 * - `remark` 是 `textarea`（rows / 计数 / 长度照旧）。
 *
 * ⚠️ **三个字段都写 `col: {span: 24}`**：旧弹层是**竖着一列**（旧 `LForm` 把默认插槽内容放在
 * 栅格 `a-row` 之外）；pro 的默认栅格是 `span: 12`（宽屏两列）⇒ 不写就会变成"名称 | 图标"两列 ✗。
 */
export const enterpriseSettingFormPage = defineFormPage(enterpriseSettingCore, {
  /** 旧壳的 `createDefaultEntity()` 只给了 `name`；`icon` / `remark` 补上（表单字段要有初值键） */
  createEntity: () => ({name: '', icon: undefined, remark: ''}),
  fields: [
    {key: 'name', component: 'input', col: {span: 24}, rules: [{required: true}]},
    {
      key: 'icon',
      component: 'iconSelect',
      col: {span: 24},
      props: {mode: ICON_SELECT_MODE.AVATAR, iconRender: renderIconFont},
    },
    {
      key: 'remark',
      component: 'textarea',
      col: {span: 24},
      props: {rows: 3, showCount: true, maxlength: 256},
    },
  ],
})
