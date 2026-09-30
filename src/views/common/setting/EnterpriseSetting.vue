<script setup lang="ts">

import {type ComponentInternalInstance, computed, getCurrentInstance, h, ref} from "vue";
import {Space} from "antdv-next";
import {EditOutlined, FileAddOutlined} from "@antdv-next/icons";
import {
  AUTH_SERVER_ENTERPRISE_MEMBER_ROLE_COLOR,
  AUTH_SERVER_ENTERPRISE_MEMBER_ROLE_ICON,
  ICON_SELECT_AVATAR_MODE_VALUE,
} from '@/constants';
import type {PersonalEnterprise} from "@loncra/client/auth";
import {
  AUTH_SERVER_AUTHENTICATION_TYPE,
  AUTH_SERVER_ENTERPRISE_MEMBER_ROLE,
} from "@loncra/client/auth";
import type {RestResult} from "@loncra/client/commons";
import {getEnumName, getEnumValue} from "@loncra/client/commons"
import {IconSelect as LIconSelect} from '@loncra/antdv'
import {requireNonNullOrUndefined} from "@/utils";
import {renderIconFont} from '@/utils/commonUtils.ts'
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {CrudFormModal as LCrudFormModal, UserAvatar as LUserAvatar} from '@loncra/antdv-pro';
import useApp from "antdv-next/dist/app/useApp";
import {
  enterpriseSettingFormPage,
  enterpriseSettingService
} from './enterprise-setting.form.page.ts';

defineOptions({
  name: 'LEnterpriseSetting',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const principalStore = usePrincipalStore()
const {modal} = useApp()

/**
 * 弹层状态：**不再持实体**（旧壳 `v-model:entity` 那套）—— 实体归声明（`createEntity`），
 * 而且弹层内容是**每次打开重挂载**的 ⇒ 这里只记"这一次给谁改"（`id` 用于取数，`name` 只用于标题）。
 */
const options = ref<{
  modal:{
    open:boolean,
    id?:number,
    name?:string,
  }
  loading:boolean
}>({
  modal:{
    open:false,
  },
  loading:false
})

/** 「解散 / 退出」与弹层共用声明里那一份 service（`new` 在声明文件里，全app只有一份） */
const service = enterpriseSettingService

/**
 * 弹层标题（旧页按 `id` 有无切换，文案照抄）。
 *
 * 图标跟 pro **默认动作**那一套（`add` = `FileAddOutlined`、`edit` = `EditOutlined`，
 * 见 `packages/antdv-pro/src/_util/crud/defaultActions.ts`）—— 与字典类型那个弹层同一个口径。
 */
const modalTitle = computed(() => {
  const current = options.value.modal
  return h(Space, null, {
    default: () => [
      h(current.id ? EditOutlined : FileAddOutlined),
      current.id
        ? globalProperties.$t('systemSetting.enterprise.edit', {name: current.name})
        : globalProperties.$t('systemSetting.enterprise.creation'),
    ],
  })
})

function onSaveSuccess(data: RestResult<number | undefined>) {
  // 关弹层（不再需要"复位实体"：内容每次打开重挂载）→ 刷 accessToken → 整页重载（旧顺序照搬）
  options.value.modal.open = false
  if (data.metadata?.accessToken) {
    const accessTokenStorageName = import.meta.env.VITE_APP_LOCAL_STORAGE_ACCESS_TOKEN_NAME
    localStorage.setItem(accessTokenStorageName, data.metadata.accessToken as string)
  }
  location.reload()
}

function onEdit(item:PersonalEnterprise) {
  options.value.modal = {open: true, id: item.id as number, name: item.name}
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
      <a-button v-if="principalStore.state.type === AUTH_SERVER_AUTHENTICATION_TYPE.PERSONAL" size="small" @click="options.modal.open = true">
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
              <l-icon-select preview :icon-render="renderIconFont" :value="item.icon || ICON_SELECT_AVATAR_MODE_VALUE.INPUT + item.name" />
              <a-typography-text>{{ item.name }}</a-typography-text>
              <a-tag :color="AUTH_SERVER_ENTERPRISE_MEMBER_ROLE_COLOR[Number(getEnumValue(item.role))] || 'purple'" variant="outlined">
                <template #icon>
                  <icon-font :type="AUTH_SERVER_ENTERPRISE_MEMBER_ROLE_ICON[Number(getEnumValue(item.role))]"/>
                </template>
                {{getEnumName(item.role)}}
              </a-tag>
              <a-tag color="success" v-if="principalStore.state.details.metadata.tenantId === item.tenantId">
                <template #icon>
                  <icon-font type="loncra-user-round-check"/>
                </template>
                {{$t('common.current')}}
              </a-tag>
            </a-flex>
            <a-space class="shrink-0">
              <a-button
                v-if="getEnumValue(item.role) === AUTH_SERVER_ENTERPRISE_MEMBER_ROLE.OWNER && principalStore.state.details.metadata.tenantId === item.tenantId"
                size="small"
                @click.stop="onEdit(item)"
              >
                <template #icon>
                  <icon-font type="loncra-file-pen-line"/>
                </template>
                {{ $t('common.edit') }}
              </a-button>
              <a-button
                v-else-if="principalStore.state.details.metadata.tenantId !== item.tenantId"
                size="small"
                @click.stop="principalStore.switchWorkspace(item.id)"
              >
                <template #icon>
                  <icon-font type="loncra-repeat"/>
                </template>
                {{ $t('systemSetting.enterprise.switch') }}
              </a-button>
              <a-button
                size="small"
                type="primary"
                v-if="principalStore.state.details.metadata.tenantId === item.tenantId"
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
            <a-tag color="success" v-if="principalStore.state.type === AUTH_SERVER_AUTHENTICATION_TYPE.PERSONAL">
              <template #icon>
                <icon-font type="loncra-user-round-check"/>
              </template>
              {{$t('common.current')}}
            </a-tag>
          </a-flex>

          <a-space class="shrink-0">
            <a-button
              v-if="principalStore.state.type !== AUTH_SERVER_AUTHENTICATION_TYPE.PERSONAL"
              size="small"
              @click.stop="principalStore.switchWorkspace(undefined)"
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

  <!--
    新增 / 编辑弹层：字段与必填、图标选择器、文本域、操作轨迹**全在声明里**
    （`enterprise-setting.form.page.ts`）—— 这里只递"给谁改"（`:id`）与标题。
    旧版的 `<teleport to="body">` 不再需要：`a-modal` 自己就挂到 body。
  -->
  <l-crud-form-modal
    v-model:open="options.modal.open"
    :page="enterpriseSettingFormPage"
    :id="options.modal.id"
    :title="modalTitle"
    @success="onSaveSuccess"
  />
</template>
