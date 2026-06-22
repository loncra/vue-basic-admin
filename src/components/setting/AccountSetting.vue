<script setup lang="ts">

import LForm from "@/components/Form.vue";
import {type ComponentInternalInstance, getCurrentInstance, inject, onMounted, ref} from "vue";
import {usePrincipalStore} from "@/stores/principalStore.ts";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import {
  APP_RELOAD_PROVIDE_KEY,
  ATTACHMENT_UPLOAD_MODE,
  VALID_REGX
} from "@/constants/systemConstant.ts";
import type {UploadChangeParam} from "antdv-next";
import type {UploadFile} from "antdv-next/dist/upload/interface";
import type {ObjectWriteResult, RestResult} from "@/types/apis";
import useApp from "antdv-next/dist/app/useApp";
import LAttachmentUpload from "@/components/attachment/AttachmentUpload.vue";
import {AttachmentService, AuthServerService} from "@/apis";
import LBasicImage from "@/components/basic/BasicImage.vue";
import {requireNonNullOrUndefined, validatePassword} from "@/utils";
import {AvatarServerService} from "@/apis/auth-server/avatarService.ts";
import LUserAvatar from "@/components/basic/UserAvatar.vue";

defineOptions({
  name: 'LAccountSetting',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const reload = inject<() => void>(APP_RELOAD_PROVIDE_KEY)
const {message, modal} = useApp()
const principalStore = usePrincipalStore()
const configProviderStore = useConfigProviderStore();
const form = ref<{
  oldPassword: string
  newPassword: string
  confirmPassword:string
}>({
  oldPassword:'',
  newPassword:'',
  confirmPassword:''
})

const loading = ref<boolean>(false);

const formRef = ref();

const historyAvatar = ref<ObjectWriteResult[] | undefined>([]);

async function fileListChange(info:UploadChangeParam) {
  if (info.file.status !== "done") {
    return ;
  }
  await principalStore.prepare()
  reload?.();
}

function beforeUpload(file:UploadFile<ObjectWriteResult>) {
  const isTypeValid = file.type === 'image/jpeg' || file.type === 'image/png';

  if (!['image/jpeg','image/png','image/jpg','image/bmp'].includes(file.type as string)) {
    message.error(globalProperties.$t('systemSetting.account.avatar.supportFormat'));
    return ;
  }

  const isSizeValid = (file?.size || 0) / 1024 / 1024 < 1;

  if (!isSizeValid) {
    message.error(globalProperties.$t('systemSetting.account.avatar.supportSize'));
    return ;
  }

  return isTypeValid && isSizeValid;
}

async function mounted() {
  const result:RestResult<ObjectWriteResult[]> = await AttachmentService.myResource('avatar', principalStore.state.name + "/")
  historyAvatar.value = result.data;
}

async function selectHistory(history:ObjectWriteResult) {
  try {
    const result:RestResult<void> = await AvatarServerService.update(history);
    message.success(result.message)
    principalStore.setAvatar(history)
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  }
}

function deleteHistory(history:ObjectWriteResult) {
  modal.confirm({
    title: globalProperties.$t('common.delete.confirmTitle'),
    content: globalProperties.$t('common.delete.confirmSingle'),
    onOk: () => doDeleteHistory(history)
  })
}

async function doDeleteHistory(history:ObjectWriteResult) {
  try {
    const result:RestResult<void> = await AttachmentService.removeAttachment([history])
    message.success(result.message)
    if (history.etag === principalStore.state?.details?.metadata?.avatar?.etag) {
      await AvatarServerService.update(null)
      principalStore.setAvatar(null)
    }
    reload?.();
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  }
}

function updatePassword() {
  formRef.value.validate().then(() => doUpdatePassword())
}

async function doUpdatePassword() {
  loading.value = true;
  try {
    const result:RestResult<void> = await AuthServerService.updatePassword(form.value.oldPassword, form.value.newPassword);
    message.success(result.message)
    globalProperties.$router.push("/" + import.meta.env.VITE_APP_AUTH_PAGE_NAME)
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false;
  }
}

onMounted(mounted)

</script>

<template>
  <div class="w-130">
    <a-card size="small" :classes="{root:'mb-sm', body:'max-h-50 overflow-auto rounded-none'}" v-if="historyAvatar && historyAvatar.length > 0">
      <template #title>
        <a-space>
          <icon-font class="icon align" type="loncra-history"/>
          <span>{{ globalProperties.$t('systemSetting.account.avatar.history') }}</span>
        </a-space>
      </template>
      <a-card-grid :hoverable="false" class="p-0 w-1/7" :key="v.etag" v-for="v of historyAvatar" >
        <l-basic-image class="h-15 w-full" :src="AttachmentService.resourceByFileObject(v)">
          <template #cover>
            <a-space-compact >
              <a-button @click.stop="selectHistory(v)" size="small" type="text" class="text-white">
                <icon-font class="icon" type="loncra-circle-check"/>
              </a-button>
              <a-button size="small" type="text" class="text-white" @click.stop="deleteHistory(v)">
                <icon-font class="icon" type="loncra-archive-x"/>
              </a-button>
            </a-space-compact>
          </template>
        </l-basic-image>
      </a-card-grid>
    </a-card>
    <div class="text-center mb-md">
      <l-attachment-upload
        accept="image/png,image/jpeg,image/jpg,image/bmp"
        :before-upload="beforeUpload"
        :show-upload-list="false"
        :action="AvatarServerService.getUploadUrl(principalStore.state)"
        @change="fileListChange"
        :mode="ATTACHMENT_UPLOAD_MODE.CUSTOMIZE"

      >
        <span class="relative inline-block cursor-pointer group rounded-full">
          <l-user-avatar :user="principalStore.state.details.metadata" :size="configProviderStore.getToken().sizeXL * 2" />
          <span class="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 transition-opacity opacity-0 group-hover:opacity-100">
            <icon-font class="icon text-white" type="loncra-image-up" />
          </span>
        </span>
      </l-attachment-upload>
    </div>

    <a-typography-title :level="4" class="text-center">
      {{ principalStore.state.details?.metadata?.realName || principalStore.state?.name }}
    </a-typography-title>
    <a-spin :spinning="loading" >
      <l-form :model="form" ref="formRef" @finish="updatePassword">
        <a-form-item :label="globalProperties.$t('auth.oldPassword')" name="oldPassword" :rules="[{required: true, trigger: 'change'}]">
          <a-input-password v-model:value="form.oldPassword" autocomplete="current-password"/>
        </a-form-item>

        <a-form-item :label="globalProperties.$t('auth.newPassword')" name="newPassword" :rules="[{required: true, trigger: 'change'}, {type: 'string', pattern: VALID_REGX.PASSWORD, message: globalProperties.$t('error.valid.password')}]">
          <a-input-password v-model:value="form.newPassword" autocomplete="new-password"/>
        </a-form-item>

        <a-form-item :label="globalProperties.$t('common.confirmPassword')" name="confirmPassword" :rules="[{required: true, trigger: 'change'}, {validator: validatePassword(form.newPassword,form.confirmPassword), trigger: 'change'}]">
          <a-input-password v-model:value="form.confirmPassword" autocomplete="new-password"/>
        </a-form-item>

        <a-divider />
        <a-button type="primary" html-type="submit" :loading="loading">
          <template #icon>
            <icon-font class="icon" type="loncra-user-check"/>
          </template>
          {{globalProperties.$t('systemSetting.account.modifyPassword')}}
        </a-button>
      </l-form>
    </a-spin>
  </div>
</template>
