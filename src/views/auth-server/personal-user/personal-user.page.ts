import type {PersonalUserEntity} from '@loncra/client/auth'
import {PersonalUserService} from '@loncra/client/auth'
import type {CrudPageCore} from '@loncra/antdv-pro'
import {
  AUTH_SERVER_PERSONAL_USER_ROUTE,
  OPERATION_DATA_TRACE_TABLE,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'

export const personalUserService = new PersonalUserService()

/**
 * 个人用户的**核心**：`service` / i18n / routes / `fields` 只写一次。
 *
 * 目前只有详情形态用（`personal-user.detail.page.ts`）—— 列表还是宿主手写的
 * `components/auth-server/PersonalUserTable.vue`，等它也搬过来时直接复用这份核心。
 */
export const personalUserCore: CrudPageCore<PersonalUserEntity> = {
  service: personalUserService,
  i18nPrefix: 'authServer.personalUser',
  routes: {
    home: AUTH_SERVER_PERSONAL_USER_ROUTE.HOME,
  },
  operationDataTraceTarget: OPERATION_DATA_TRACE_TABLE.PERSONAL_USER,
  fields: {
    id: {labelKey: 'common.id'},
    /** 显示的是 `nickname`，但标签沿用旧页面的「真实姓名」 */
    nickname: {labelKey: 'common.realName'},
    username: {labelKey: 'auth.account'},
    email: {labelKey: 'common.email'},
    phoneNumber: {labelKey: 'common.phoneNumber'},
    /**
     * 性别 / 状态：显示用 `format: 'enum'`（= 宿主 `getEnumName`，值可能是裸 code）；
     * `enumRef` 是留给以后表单形态用的（与 `console-user` 同一份枚举）。
     */
    gender: {
      labelKey: 'common.gender',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.GENDER_ENUM},
    },
    status: {
      labelKey: 'common.status',
      format: 'enum',
      enumRef: {module: SYSTEM_MODULE_NAME.RESOURCE_SERVER, id: SYSTEM_ENUM_TYPE.USER_STATUS_ENUM},
    },
    lastAuthenticationTime: {labelKey: 'authServer.lastAuthenticationTime', format: 'dateTime'},
    promoCode: {labelKey: 'authServer.personalUser.promoCode'},
    tenantId: {labelKey: 'authServer.enterprise.tenantId'},
  },
}
