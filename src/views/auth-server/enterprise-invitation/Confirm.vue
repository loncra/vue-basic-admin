<script setup lang="ts">

import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from "vue";
import {dateTimeFormat, getEnumName, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {AuthServerService, EnterpriseService} from "@/apis";
import type {EnterpriseInvitationDetail, RestResult} from "@/types/apis";
import {AUDIT_STATUS_TYPE, ICON_SELECT_AVATAR_MODE_VALUE, USER_STATUS_TYPE} from "@/constants";
import LIconSelect from "@/components/basic/IconSelect.vue";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";

defineOptions({
  name: 'AuthServerEnterpriseInvitationConfirm',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()

const options = ref<{
  loading:boolean,
  detail?:EnterpriseInvitationDetail
  currentTime:number
}>({
  currentTime:0,
  loading:false,
})

const enterpriseService = new EnterpriseService()

function mounted() {
  const {id} = globalProperties.$route.params
  const data:Record<string, string>[] = [];
  if (!id) {
    data.push({code:"400",field:'id',defaultMessage: globalProperties.$t('error.notNull', {field: 'id'})})
  }
  if (data.length > 0) {
    sessionStorage.setItem(import.meta.env.VITE_APP_SESSION_STORAGE_BAD_REQUEST_NAME, JSON.stringify(data));
    globalProperties.$router.push({name:"400"});
    return ;
  }

  loadInvitationDetail(Number(id))
}

async function onConfirm(confirm:boolean) {
  if (!options.value.detail) {
    return
  }
  options.value.loading = true
  try {
    const result:RestResult<EnterpriseInvitationDetail> = await enterpriseService.invitationConfirm(
      Number(options.value.detail.id),
      confirm
    )
    if (result.data) {
      options.value.detail = result.data
    }
  } finally {
    options.value.loading = false
  }
}

async function loadInvitationDetail(id:number) {

  try {
    options.value.loading = true
    const result:RestResult<EnterpriseInvitationDetail> = await enterpriseService.invitationDetail(id)
    if (result.data) {
      options.value.detail = result.data
    } else {
      globalProperties.$router.push({name:"404"});
    }
    options.value.currentTime = result.timestamp
  } finally {
    options.value.loading = false
  }

}

function getInviteeAttr() {
  if (!options.value?.detail?.invitee) {
    return {}
  }
  if (getEnumValue(options.value.detail.invitee.auditStatus) === AUDIT_STATUS_TYPE.AGREED) {
    return {
      status:"success",
      title:"您已加入该企业",
      subTitle:"您已是该企业成员，角色为[" + getEnumName(options.value.detail.invitee.role) + (options.value.detail.invitee?.roles || []).map(role => role.name).join(',') + "]，无需重复接受邀请。"
    }
  } else if (getEnumValue(options.value.detail.invitee.auditStatus) === AUDIT_STATUS_TYPE.AUDITABLE) {
    return {
      status:"info",
      title:"您已加入该企业",
      subTitle:"您的账户目前处于审核状态，请等待管理员审核。"
    }
  } else if (getEnumValue(options.value.detail.invitee.auditStatus) === AUDIT_STATUS_TYPE.REJECTED) {
    return {
      status:"warning",
      title:"请求已被您拒绝",
      subTitle:"您已经拒绝此邀请，如需要重新加入该企业，请联系管理员重新发起新的邀请。"
    }
  } else if (getEnumValue(options.value.detail.invitee.auditStatus) === AUDIT_STATUS_TYPE.DISAGREE) {
    return {
      status:"error",
      title:"企业审核不通过",
      subTitle:"您的加入请求已被企业拒绝，如需要重新加入该企业，请联系管理员重新发起新的邀请。"
    }
  } else {
    return {
      status:"404",
      title:"未知的邀请结果",
      subTitle:"当前企业对该加入的审核结果为[" + getEnumName(options.value.detail.invitee.auditStatus) + "]，请联系管理员进行核实。"
    }
  }
}

onMounted(mounted)

</script>

<template>
  <a-flex justify="center" align="center">
    <a-card class="shadow-card w-120" v-if="options.detail">
      <template #title>
        <a-space>
          <l-icon-select preview :value="options.detail.enterprise.icon || ICON_SELECT_AVATAR_MODE_VALUE.INPUT + options.detail.enterprise.name" />
          <a-typography-text strong class="text-xl">
            {{options.detail.enterprise.name}}
          </a-typography-text>
        </a-space>
      </template>
      <template #extra>
        {{ globalProperties.$t('authServer.enterpriseInvitation.confirm') }}
      </template>
      <a-spin :spinning="options.loading" class="size-full-spin">
        <a-flex gap="middle" vertical>
          <template v-if="!options.detail.invitee">
            <a-flex gap="middle" vertical class="w-full">
              <a-space>
                <l-user-avatar :user="options.detail.member" />
                {{AuthServerService.getPrincipalNameByUserDetails(options.detail.member)}}
                {{$t('authServer.enterpriseInvitation.invitation',{name:' ' + options.detail.enterprise.name + ' '}) }}
              </a-space>
              <a-card size="small" :title="$t('common.detail')">
                <a-flex justify="space-between" align="center">
                  <a-typography-text type="secondary">{{$t('authServer.enterpriseMember.role')}}</a-typography-text>
                  <a-typography-text>{{(options.detail?.roles || []).map(role => role.name).join(',')}}</a-typography-text>
                </a-flex>
                <a-divider />
                <a-flex justify="space-between" align="center">
                  <a-typography-text type="secondary">{{$t('common.expiresTime')}}</a-typography-text>
                  <a-typography-text>{{options.detail.expirationTime ? dateTimeFormat(options.detail.expirationTime) : $t('common.permanent')}}</a-typography-text>
                </a-flex>
                <a-divider />
                <a-flex justify="space-between" align="center">
                  <a-typography-text type="secondary">{{$t('authServer.enterpriseInvitation.auditType')}}</a-typography-text>
                  <a-typography-text>{{getEnumName(options.detail.auditType)}}</a-typography-text>
                </a-flex>
              </a-card>
            </a-flex>
            <a-alert v-if="options.detail.subTitle" :title="options.detail.subTitle" type="info" show-icon />
            <a-typography-text class="text-center" v-if="options.detail.expirationTime && options.detail.expirationTime < options.currentTime">
              ⏰ {{ $t('authServer.enterpriseInvitation.expiresTitle') }}
            </a-typography-text>
            <a-space-compact block v-else>
              <a-button block type="primary" @click="onConfirm(true)">
                <icon-font type="loncra-handshake"/>
                {{ $t('authServer.enterpriseInvitation.accept') }}
              </a-button>
              <a-button block type="primary" danger @click="onConfirm(false)">
                <icon-font type="loncra-x"/>
                {{ $t('authServer.enterpriseInvitation.reject') }}
              </a-button>
            </a-space-compact>
          </template>
          <template v-else>
            <a-result
              v-bind="getInviteeAttr()"
            >
              <template #extra v-if="getEnumValue(options.detail.invitee.status) === USER_STATUS_TYPE.ENABLED && options.detail.enterprise.id !== principalStore.state.details.metadata.enterpriseId">
                <a-button type="primary" @click="principalStore.switchWorkspace(options.detail.enterprise.id)">
                  进入工作台
                </a-button>
              </template>
            </a-result>
          </template>
        </a-flex>
      </a-spin>
    </a-card>
  </a-flex>
</template>
