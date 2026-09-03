<script setup lang="ts">

import {type ComponentInternalInstance, getCurrentInstance, inject, ref} from "vue";
import {
  AUTH_SERVER_ENTERPRISE_MEMBER_ROLE,
  AUTH_SERVER_ENTERPRISE_MEMBER_ROLE_COLOR,
  AUTH_SERVER_ENTERPRISE_MEMBER_ROLE_ICON,
  ICON_SELECT_AVATAR_MODE_VALUE,
  ICON_SELECT_MODE,
  OPERATION_DATA_TRACE_TABLE,
  SWITCH_WORKSPACE_PROVIDE_KEY
} from "@/constants";
import LModalForm from "@/components/basic/form/ModalForm.vue";
import {EnterpriseService} from "@/apis";
import type {EnterprisePayload, PersonalEnterprise} from "@/types/apis";
import LIconSelect from "@/components/basic/IconSelect.vue";
import type {IconfontJson} from "@/types/composables";
import {getEnumName, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import LUserAvatar from "@/components/basic/UserAvatar.vue";
import useApp from "antdv-next/dist/app/useApp";

defineOptions({
  name: 'LEnterpriseSetting',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()
const {modal} = useApp()

const switchWorkspace = inject<(item: {key:string}) => void>(SWITCH_WORKSPACE_PROVIDE_KEY)

const options = ref<{
  modal:{
    open:boolean,
    form:EnterprisePayload
  }
  iconOptions: IconfontJson[]
  loading:boolean
}>({
  modal:{
    open:false,
    form:createDefaultEntity()
  },
  iconOptions:[],
  loading:false
})

function createDefaultEntity() {
  return {
    name: '',
  }
}
const modalForm = ref()

const service = new EnterpriseService()

async function onSaveSuccess() {
  modalForm.value.cancel();
  options.value.modal.form = createDefaultEntity()
  location.reload()
}

function onEdit(item:PersonalEnterprise) {
  options.value.modal.form = {...item}
  options.value.modal.open = true
}

function onLeave(item:PersonalEnterprise) {
  if (getEnumValue(item.role) === AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER) {
    modal.confirm({
      title: globalProperties.$t('systemSetting.enterprise.disband.title'),
      content: globalProperties.$t('systemSetting.enterprise.disband.subTitle',{name:item.name}),
      onOk: () => doLeave(item.id as number)
    })
  } else {
    modal.confirm({
      title: globalProperties.$t('systemSetting.enterprise.leave.title'),
      content: globalProperties.$t('systemSetting.enterprise.leave.subTitle',{name:item.name}),
      onOk: () => doLeave(item.id as number)
    })
  }

}

async function doLeave(id:number) {
  options.value.loading = true
  try {
    await service.leave(id)
    await principalStore.prepare()
  } finally {
    options.value.loading = false
  }
}

</script>

<template>
  <a-flex
    gap="middle"
    class="min-w-180"
    vertical
  >
    <a-flex justify="space-between" align="center">
      <a-typography-text strong>
        {{ $t('systemSetting.enterprise.title') }}
      </a-typography-text>
      <a-button size="small" @click="options.modal.open = true">
        <template #icon>
          <icon-font class="icon" type="loncra-building" />
        </template>
        {{ $t('systemSetting.enterprise.creation') }}
      </a-button>
    </a-flex>
    <a-divider class="m-0"></a-divider>
    <a-spin :spinning="options.loading">
      <a-flex
        vertical
        gap="middle"
        v-if="principalStore.state.enterpriseDataSource.length > 0"
        class="rounded-lg p-sm border border-border-secondary"
      >
        <template
          :key="item.id"
          v-for="item of principalStore.state.enterpriseDataSource"
        >
          <a-flex
            junstify="space-between"
            align="center"
          >
            <a-flex
              gap="small"
              align="center"
              flex="1"
            >
              <l-icon-select preview :value="item.icon || ICON_SELECT_AVATAR_MODE_VALUE.INPUT + item.name" />
              <a-typography-text>{{ item.name }}</a-typography-text>
              <a-tag :color="AUTH_SERVER_ENTERPRISE_MEMBER_ROLE_COLOR[Number(getEnumValue(item.role))] || 'purple'" variant="outlined">
                <template #icon>
                  <icon-font :type="AUTH_SERVER_ENTERPRISE_MEMBER_ROLE_ICON[Number(getEnumValue(item.role))]"/>
                </template>
                {{getEnumName(item.role)}}
              </a-tag>
              <a-tag color="success" v-if="principalStore.state.details.metadata?.enterprise?.id === String(item.id)">
                <template #icon>
                  <icon-font type="loncra-user-round-check"/>
                </template>
                {{$t('common.current')}}
              </a-tag>
            </a-flex>
            <a-space class="shrink-0">
              <a-button
                v-if="getEnumValue(item.role) === AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER && principalStore.state.details.metadata?.enterprise?.id === String(item.id)"
                size="small"
                @click.stop="onEdit(item)"
              >
                <template #icon>
                  <icon-font type="loncra-file-pen-line"/>
                </template>
                {{ $t('common.edit') }}
              </a-button>
              <a-button
                v-else-if="principalStore.state.details.metadata?.enterprise?.id !== String(item.id)"
                size="small"
                @click.stop="switchWorkspace?.({key:String(item.id)})"
              >
                <template #icon>
                  <icon-font type="loncra-repeat"/>
                </template>
                {{ $t('systemSetting.enterprise.switch') }}
              </a-button>
              <a-button
                size="small"
                type="primary"
                v-if="principalStore.state.details.metadata?.enterprise?.id === String(item.id)"
                danger
                @click.stop="onLeave(item)"
              >
                <template #icon>
                  <icon-font type="loncra-log-out"/>
                </template>
                <template v-if="getEnumValue(item.role) === AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER">
                  {{ $t('systemSetting.enterprise.disband.action') }}
                </template>
                <template v-else>
                  {{ $t('systemSetting.enterprise.leave.action') }}
                </template>
              </a-button>
            </a-space>
          </a-flex>
          <a-divider class="m-0" />
        </template>
        <a-flex
          junstify="space-between"
          align="center"
        >
          <a-flex flex="1" gap="small" align="center">
            <l-user-avatar :user="principalStore.state.details.metadata" />
            <a-typography-text>{{ principalStore.getName()}}</a-typography-text>
            <a-tag color="blue" variant="outlined">
              <template #icon>
                <icon-font type="loncra-user"/>
              </template>
              {{$t('auth.personalAccount')}}
            </a-tag>
            <a-tag color="success" v-if="principalStore.state.details.metadata.enterprise === undefined">
              <template #icon>
                <icon-font type="loncra-user-round-check"/>
              </template>
              {{$t('common.current')}}
            </a-tag>
          </a-flex>

          <a-space class="shrink-0">
            <a-button
              v-if="principalStore.state.details.metadata.enterprise !== undefined"
              size="small"
              @click.stop="switchWorkspace?.({key:principalStore.state.name})"
            >
              <template #icon>
                <icon-font type="loncra-repeat"/>
              </template>
              {{ $t('systemSetting.enterprise.switch') }}
            </a-button>
          </a-space>
        </a-flex>
      </a-flex>
      <a-empty v-else />
    </a-spin>
  </a-flex>

  <teleport to="body">
    <l-modal-form
      ref="modalForm"
      @cancel="options.modal.form = {...createDefaultEntity()}"
      @success="onSaveSuccess"
      :title="options.modal.form.id ? $t('systemSetting.enterprise.edit',{name:options.modal.form.name}) : $t('systemSetting.enterprise.creation')"
      v-model:open="options.modal.open"
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.ENTERPRISE"
      :service="service"
      v-model:entity="options.modal.form"
    >
      <a-form-item name="name" :label="$t('common.name')" :rules="[{required: true}]">
        <a-input v-model:value="options.modal.form.name" />
      </a-form-item>

      <a-form-item
        name="icon"
        :label="$t('common.icon')"
      >
        <l-icon-select
          class="w-full"
          :mode="ICON_SELECT_MODE.AVATAR"
          v-model:value="options.modal.form.icon"
          :options="options.iconOptions"
        />
      </a-form-item>
      <a-form-item name="remark" :label="$t('common.remark')">
        <a-textarea v-model:value="options.modal.form.remark" :rows="3" show-count :maxlength="256" />
      </a-form-item>
    </l-modal-form>
  </teleport>
</template>
