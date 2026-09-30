import type {EnterpriseMemberEntity, EnterpriseMemberSavePayload} from '@loncra/client/auth'
import {EnterpriseMemberService} from '@loncra/client/auth'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {
  AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE,
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'

export const enterpriseMemberService = new EnterpriseMemberService()

/**
 * 形态名（**宿主起的名**，pro 只原样转发）：邀请展开行里那张"待审核成员"表用它 ——
 * 与整页成员管理是**同一个声明**，差别只在动词与两三个列/动作上。
 */
export const ENTERPRISE_MEMBER_VARIANT = {AUDIT: 'audit'} as const

/**
 * 企业成员的**核心**：service / i18nPrefix / routes / 字段字典只写一次
 * （旧实现是 `components/auth-server/EnterpriseMemberTable.vue` + `enterprise-member/Home.vue` 各一份）。
 */
export const enterpriseMemberCore: CrudPageCore<
  EnterpriseMemberSavePayload,
  EnterpriseMemberEntity
> = {
  service: enterpriseMemberService,
  i18nPrefix: 'authServer.enterpriseMember',
  routes: {
    home: AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE.HOME,
    detail: AUTH_SERVER_ENTERPRISE_MEMBER_ROUTE.DETAIL,
  },
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.ENTERPRISE_MEMBER,
  fields: {
    // 注意：实体字段是 `realName`（`PlatformUser`），旧表列上写的 `name` 是它自己的一个别名。
    // 「头像 + 名称」的显示写在**列表列**上（`format: {name: 'principalName', args: {self: true}}`，
    // 见 `enterprise-member.home.page.ts`）—— 不放这份字典里是因为 home / detail 共用它，
    // 而详情要的是纯文本（旧 `Detail.vue` 就是 `{{entity.nickname || ''}}`）。
    realName: {labelKey: 'common.realName'},
    /** 详情显示的是 `nickname`（旧 `Detail.vue` 那句 `{{entity.nickname || ''}}`）⇒ 与 `realName` 同一句 label */
    nickname: {labelKey: 'common.realName'},
    username: {labelKey: 'auth.account'},
    principal: {labelKey: 'authServer.enterpriseMember.principal'},
    // 四个枚举的显示靠值自带元数据，**搜索下拉的 options 靠这里的 enumRef 推导**
    // （旧表是 `mounted` 里手拉四个枚举再 `applyColumnOptions`）
    gender: {
      labelKey: 'common.gender',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.GENDER_ENUM},
    },
    role: {
      labelKey: 'authServer.enterpriseMember.role',
      format: 'enum',
      enumRef: {
        module: SYSTEM_MODULE_NAME.AUTH_SERVER,
        id: SYSTEM_ENUM_TYPE.ENTERPRISE_MEMBER_ROLE_ENUM,
      },
    },
    // 显示成「状态点 + 状态名」：宿主注册的 `auditStatus` formatter
    // （10/20/30/40 → processing/success/error/warning，其余 default；备注非空时套 Tooltip 显示 `remark`）。
    // `enumRef` 留着 —— 列表列的搜索下拉靠它喂 options。
    auditStatus: {
      labelKey: 'common.auditStatus',
      format: 'auditStatus',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.AUDIT_STATUS_ENUM},
    },
    status: {
      labelKey: 'common.status',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.USER_STATUS_ENUM},
    },
    phoneNumber: {labelKey: 'common.phoneNumber'},
    lastAuthenticationTime: {labelKey: 'authServer.lastAuthenticationTime', format: 'dateTime'},
    remark: {labelKey: 'common.remark'},
  },
}
