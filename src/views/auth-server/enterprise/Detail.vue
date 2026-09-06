<script setup lang="ts">
import LBasicDetail from '@/components/basic/BasicDetail.vue'
import LIconSelect from '@/components/basic/IconSelect.vue'
import {EnterpriseService} from '@/apis/auth-server/enterpriseService.ts'
import {dateTimeFormat, getEnumName, requireNonNullOrUndefined} from '@/utils'
import {type ComponentInternalInstance, getCurrentInstance, ref} from 'vue'
import type {EnterpriseEntity} from '@/types/apis/auth-server/enterpriseDomain'
import {
  AUTH_SERVER_ENTERPRISE_ROUTE,
  ICON_SELECT_AVATAR_MODE_VALUE,
  OPERATION_DATA_TRACE_TABLE,
  YES_OR_NO_TYPE,
} from '@/constants'

defineOptions({
  name: 'AuthServerEnterpriseDetail',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new EnterpriseService()
const entity = ref<EnterpriseEntity>({
  id: 0,
  version: 0,
  name: '',
  ownerPrincipal: '',
  enabled: YES_OR_NO_TYPE.YES,
})

</script>

<template>
  <div>
    <l-basic-detail
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.ENTERPRISE"
      :redirect="{name:AUTH_SERVER_ENTERPRISE_ROUTE.HOME}"
      :title-text="(title:string, _entity:EnterpriseEntity) => title + ' (' + _entity.name + ')'"
      :service="service"
      :column="{xxxl: 2,xxl: 2,xl: 2,lg: 2,md: 2,sm: 1,xs: 1}"
      v-model:entity="entity"
    >
      <a-descriptions-item :label="globalProperties.$t('common.id')">
        {{entity.id}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.name')">
        <a-space>
          <l-icon-select preview :value="entity.icon || ICON_SELECT_AVATAR_MODE_VALUE.INPUT + entity.name" />
          {{entity.name}}
        </a-space>
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.enterprise.ownerPrincipal')">
        {{entity.ownerPrincipal}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.enabled')">
        {{getEnumName(entity.enabled)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.enterprise.tenantId')">
        {{entity.tenantId || ''}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.remark')">
        {{entity.remark || ''}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('authServer.enterprise.disbandTime')">
        {{dateTimeFormat(entity.disbandTime)}}
      </a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('common.creationTime')">
        {{dateTimeFormat(entity.creationTime)}}
      </a-descriptions-item>
    </l-basic-detail>
  </div>
</template>
