<script setup lang="ts">
import LBasicDetail from "@/components/basic/BasicDetail.vue";
import {dateTimeFormat, requireNonNullOrUndefined} from "@/utils";
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";

import {AuditEventService} from "@/apis/auth-server/auditEventService.ts";
import type {AuditEventEntity} from "@/types/apis/auth-server/auditDomain";
import type {RestResult} from "@/types/apis";

defineOptions({
  name: 'AuthServerAuditEventDetail',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new AuditEventService()
const entity = ref<AuditEventEntity>({
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
      <a-descriptions-item :label="globalProperties.$t('operation.principal')">{{ entity.data?.details?.metadata?.realName || entity.principal }}</a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('operation.time')">{{ dateTimeFormat(entity.timestamp) }}</a-descriptions-item>
      <a-descriptions-item :label="globalProperties.$t('operation.type')">{{ entity.type }}</a-descriptions-item>

      <template #afterDescriptions>
        <template v-if="entity?.data?.details || false">
          <a-divider orientation="left" plain>
            <a-space>
              <icon-font class="icon align" type="icon-customer-bussinessman"/>
              <span >{{ globalProperties.$t('operation.principal') + ' ' + globalProperties.$t('common.basicInformation')}}</span>
            </a-space>
          </a-divider>
          <a-descriptions bordered :column="{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }" class="margin-top-lg">
            <a-descriptions-item v-for="(value, key) in entity.data.details" :key="key" :label="key">
              {{ value }}
            </a-descriptions-item>
          </a-descriptions>
        </template>

        <template v-if="entity?.data?.metadata.headers">
          <a-divider orientation="left" plain="">
            <a-space>
              <icon-font class="icon align" type="icon-post"/>
              <span>{{  globalProperties.$t('common.request.header') + ' ' + globalProperties.$t('common.basicInformation')}}</span>
            </a-space>
          </a-divider>
          <a-descriptions bordered :column="{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }" class="margin-top-lg">
            <a-descriptions-item v-for="(value, key) in entity?.data?.metadata.headers" :key="key" :label="key">
              {{ value }}
            </a-descriptions-item>
          </a-descriptions>
        </template>

        <template v-if="entity?.data?.metadata.parameters">
          <a-divider orientation="left" plain="">
            <a-space>
              <icon-font class="icon align" type="icon-tool"/>
              <span>{{  globalProperties.$t('common.request.parameter') + ' ' + globalProperties.$t('common.basicInformation')}}</span>
            </a-space>
          </a-divider>
          <a-descriptions bordered :column="{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }" class="margin-top-lg">
            <a-descriptions-item v-for="(value, key) in entity?.data?.metadata.parameters" :key="key" :label="key">
              {{ value }}
            </a-descriptions-item>
          </a-descriptions>
        </template>

        <template v-if="entity?.data?.metadata.body">
          <a-divider orientation="left" plain="">
            <a-space>
              <icon-font class="icon align" type="icon-tool"/>
              <span>{{  globalProperties.$t('common.request.body') + ' ' + globalProperties.$t('common.basicInformation')}}</span>
            </a-space>
          </a-divider>
          <a-descriptions bordered :column="{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }" class="margin-top-lg">
            <a-descriptions-item v-for="(value, key) in entity?.data?.metadata.body" :key="key" :label="key">
              {{ value }}
            </a-descriptions-item>
          </a-descriptions>
        </template>

        <template v-if="entity?.data?.operationTrace">
          <a-divider orientation="left" plain>
            <a-space>
              <icon-font class="icon align" type="icon-order-location"/>
              <span>{{ globalProperties.$t('operation.data') }}</span>
            </a-space>
          </a-divider>

          <a-descriptions bordered :column="{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }" class="margin-top-lg">
            <a-descriptions-item v-for="(value, key) in entity?.data?.operationTrace" :key="key" :label="key">
              {{ value }}
            </a-descriptions-item>
          </a-descriptions>
        </template>
      </template>
    </l-basic-detail>
  </div>
</template>
