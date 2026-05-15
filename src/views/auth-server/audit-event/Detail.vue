<script setup lang="ts">
import LBasicDetail from "@/components/basic/BasicDetail.vue";
import {dateTimeFormat, requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";

import {AuditEventService} from "@/apis/auth-server/auditEventService.ts";
import type {AuditEventEntity} from "@/types/auth-server/auditEntityType.ts";
import type {RestResult} from "@/types";

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new AuditEventService()
const entity = ref<AuditEventEntity>({
  data: {

  },
  id: "",
  principal: "",
  timestamp: 0,
  type: ""
})

async function getDetail(id: string): Promise<RestResult<AuditEventEntity>> {
  return await service.detail(id, globalProperties.$route.query.after as string);
}

</script>

<template>
  <div>
    <l-basic-detail
      :query-fields="['id','after']"
      :redirect="{name: globalProperties.$route.name === 'auth_server_audit_event_authentication_detail' ? 'auth_server_audit_event_authentication' : 'auth_server_audit_event_operation_data_trace'}"
      :get-detail="getDetail"
      :service="service"
      :column="{xxxl: 2,xxl: 2,xl: 2,lg: 2,md: 2,sm: 1,xs: 1}"
      v-model:entity="entity"
    >
      <a-descriptions-item :label="globalProperties.$t('common.id')">{{ entity.id }}</a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('operation.principal')">{{ entity.principal }}</a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('operation.time')">{{ dateTimeFormat(entity.timestamp) }}</a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('operation.type')">{{ entity.type }}</a-descriptions-item>

      <template #afterDescriptions>
        <template v-if="entity?.data?.details || false">
          <a-divider orientation="left" plain>
            <a-space>
              <icon-font class="icon align" type="icon-customer-bussinessman"/>
              <span >{{ globalProperties.$t('operation.principal') + globalProperties.$t('common.basicInformation')}}</span>
            </a-space>
          </a-divider>
          <a-descriptions bordered :column="{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }" class="margin-top-lg">
            <a-descriptions-item v-for="(value, key) in entity.data.details" :key="key" :label="key">
              {{ value }}
            </a-descriptions-item>
          </a-descriptions>
        </template>

        <template v-if="entity?.data?.operationDataTrace">
          <a-divider orientation="left" plain>
            <a-space>
              <icon-font class="icon align" type="icon-order-location"/>
              <span>{{ globalProperties.$t('operation.data') }}</span>
            </a-space>
          </a-divider>

          <a-descriptions bordered :column="{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }" class="margin-top-lg">
            <a-descriptions-item v-for="(value, key) in entity.data.operationDataTrace" :key="key" :label="key">
              {{ value }}
            </a-descriptions-item>
          </a-descriptions>
        </template>
      </template>
    </l-basic-detail>
  </div>
</template>
