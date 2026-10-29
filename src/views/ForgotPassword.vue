<script setup lang="ts">
import {renderIconFont} from '@/utils/commonUtils'

import LLogo from "@/components/Logo.vue";
import {type ComponentInternalInstance, computed, getCurrentInstance, ref} from "vue";
import {requireNonNullOrUndefined, validatePassword} from "@/utils";
import {VALID_REGX} from '@/constants';
import type {
  IdNameValueMetadata,
  IdValueMetadata,
  PageRequest,
  RestResult
} from "@loncra/client/commons";
import {AuthServerService, type PlatformUser} from "@loncra/client/auth";
import type {
  CaptchaGenerationResult,
  CaptchaToken,
  CaptchaTokenType
} from "@loncra/client/resource";
import {RESOURCE_SERVER_CAPTCHA_TOKEN_TYPE} from '@loncra/client/resource'
import {
  buildCaptchaSubmitParams,
  CaptchaSendButton,
  type CaptchaSendResult,
  Form as LForm,
  useCaptchaSend,
  UserAvatar
} from '@loncra/antdv-pro';
import useApp from "antdv-next/dist/app/useApp";

defineOptions({
  name: 'ForgotPasswordHome',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const {message} = useApp()

const segmentedData = computed(() => [{
  label: globalProperties.$t('common.email'),
  value: RESOURCE_SERVER_CAPTCHA_TOKEN_TYPE.EMAIL,
  icon: renderIconFont('loncra-email', 'align'),
  rules: [{required: true, trigger: 'change', type: 'email'}]
}, {
  label: globalProperties.$t('common.phoneNumber'),
  value: RESOURCE_SERVER_CAPTCHA_TOKEN_TYPE.SMS,
  icon: renderIconFont('loncra-tablet-smartphone', 'align'),
  rules: [{required: true, trigger: 'change'}, {
    type: 'string',
    pattern: VALID_REGX.PHONE_NUMBER,
    message: globalProperties.$t('error.valid.phoneNumber'),
    trigger: 'change'
  }]
}])

const step = ref<number>(1)
const loading = ref<boolean>(false);

const systemUsers = ref<IdNameValueMetadata<PlatformUser[]>[]>([])

useCaptchaSend()
const captchaSendButtonRef = ref<{trigger: () => void}>()

const generateCaptcha = ref<{
  token?: CaptchaToken
  captchaParams?: Record<string, unknown>
  result?: CaptchaGenerationResult
}>({
})

const resendCooling = ref(false)

const captchaAppend = computed(() =>
  resetPasswordForm.value.metadata.id === RESOURCE_SERVER_CAPTCHA_TOKEN_TYPE.EMAIL
    ? {email: resetPasswordForm.value.metadata.value, messageType: 'system.email.captcha.forgot-password'}
    : {phoneNumber: resetPasswordForm.value.metadata.value, messageType: 'system.sms.captcha.forgot-password'},
)

function onCaptchaSent(result: CaptchaSendResult) {
  generateCaptcha.value = {
    token: result.token,
    captchaParams: result.captchaParams,
    result: result.generateResult,
  }
  resendCooling.value = true
  step.value = 2
}

const resetPasswordForm = ref<{
  type?: string
  userId?: number
  metadata: IdValueMetadata<string, string>
  newPassword: string,
  confirmPassword: string,
  captchaValue: string
}>({
  captchaValue: "",
  confirmPassword: "",
  newPassword: "",
  metadata: {
    id: RESOURCE_SERVER_CAPTCHA_TOKEN_TYPE.EMAIL,
    value: ""
  }
})

const authPageName = import.meta.env.VITE_APP_AUTH_PAGE_NAME

const sendCaptchaFormRef = ref()
const resetPasswordFormRef = ref()

async function beforeSend() {
  if (loading.value) {
    return false
  }
  if (resetPasswordForm.value.userId && resetPasswordForm.value.type) {
    return true
  }
  loading.value = true
  let ok = false
  try {
    const param: PageRequest = {
      number: 1
    }
    if (resetPasswordForm.value.metadata.id === RESOURCE_SERVER_CAPTCHA_TOKEN_TYPE.EMAIL) {
      param['filter_[email_eq]'] = resetPasswordForm.value.metadata.value
    } else if (resetPasswordForm.value.metadata.id === RESOURCE_SERVER_CAPTCHA_TOKEN_TYPE.SMS) {
      param['filter_[phone_number_eq]'] = resetPasswordForm.value.metadata.value
    } else {
      return false
    }

    const systemUserResult: RestResult<IdNameValueMetadata<PlatformUser[]>[]> = await AuthServerService.systemUsers(param)
    if (!systemUserResult.data || systemUserResult.data.length <= 0) {
      message.warning(resetPasswordForm.value.metadata.value + "找不到相关账户信息，无法进行下一步")
      return false
    }

    systemUsers.value = systemUserResult.data || []
    if (isMultiUsers()) {
      return false
    }
    const user = systemUsers.value.flatMap(item => item.value)[0]
    const group = systemUsers.value[0]
    onSelectedUser(user?.id, group?.id)
    ok = true
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false
  }
  return ok
}

async function submitRestPassword() {
  if (!generateCaptcha.value.token) {
    return
  }
  if (!resetPasswordForm.value.type || !resetPasswordForm.value.userId) {
    return
  }
  loading.value = true
  try {
    const postAppend = {
      [(generateCaptcha.value.token.args.post as {
        captchaParamName: string
      }).captchaParamName]: resetPasswordForm.value.captchaValue
    }
    if (resetPasswordForm.value.metadata.id === RESOURCE_SERVER_CAPTCHA_TOKEN_TYPE.SMS) {
      postAppend.phoneNumber = resetPasswordForm.value.metadata.value
    } else if (resetPasswordForm.value.metadata.id === RESOURCE_SERVER_CAPTCHA_TOKEN_TYPE.EMAIL) {
      postAppend.email = resetPasswordForm.value.metadata.value
    }
    const append = buildCaptchaSubmitParams(generateCaptcha.value.token, resetPasswordForm.value.captchaValue, postAppend)
    const result: RestResult<void> = await AuthServerService.resetPassword(
      resetPasswordForm.value.type,
      resetPasswordForm.value.userId,
      resetPasswordForm.value.newPassword,
      resetPasswordForm.value.confirmPassword,
      append
    )
    message.success(result.message)
    globalProperties.$router.push({name: import.meta.env.VITE_APP_AUTH_PAGE_NAME})
  } catch (e) {
    message.error(e instanceof Error ? e.message : String(e))
  } finally {
    loading.value = false
  }
}

function isMultiUsers() {
  return systemUsers.value.length > 1 || systemUsers.value.flatMap(item => item.value).length > 1
}

function onSelectedUser(id: number | unknown, type: string | unknown) {
  if (id) {
    resetPasswordForm.value.userId = Number(id)
  }
  if (type) {
    resetPasswordForm.value.type = String(type)
  }
}

function resetUser(){
  if (systemUsers.value.length <= 0) {
    return ;
  }

  resetPasswordForm.value.type = undefined
  resetPasswordForm.value.userId = undefined
  systemUsers.value = []
}

function isSelect(user: PlatformUser, type: string) {
  return resetPasswordForm.value.userId === user.id && resetPasswordForm.value.type === type
}
</script>

<template>
  <a-flex class="h-screen" justify="center" align="center">
    <a-card class="shadow-card w-120">
      <template #title>
        <l-logo/>
      </template>
      <template #extra>
        {{ $t('forgotPassword.title') }}
      </template>
      <a-flex class="size-full">

        <a-spin :spinning="loading" class="size-full-spin">
          <a-flex gap="middle" vertical class="w-full">

            <template v-if="step === 1">
              <a-typography-text type="secondary">
                {{ $t('forgotPassword.step.sendCaptcha.subTitle') }}
              </a-typography-text>
              <a-segmented block :options="segmentedData"
                           v-model:value="resetPasswordForm.metadata.id"/>

              <l-form ref="sendCaptchaFormRef"
                      @finish="sendCaptchaFormRef.validate().then(() => captchaSendButtonRef?.trigger())"
                      :model="resetPasswordForm.metadata">
                <a-form-item name="value"
                             :label="segmentedData.find(s => s.value === resetPasswordForm.metadata.id)?.label"
                             :rules="segmentedData.find(s => s.value === resetPasswordForm.metadata.id)?.rules">
                  <a-input class="w-full" v-model:value="resetPasswordForm.metadata.value" @change="resetUser"/>
                </a-form-item>
                <template v-if="isMultiUsers()">
                  <div class="mb-md">
                    <a-alert
                      :description="$t('forgotPassword.step.multiUsersSelected.subTitle', {type: segmentedData.find(s => s.value === resetPasswordForm.metadata.id)?.label,target: resetPasswordForm.metadata.value})"
                      type="info"
                      show-icon
                    />
                  </div>

                  <template :key="typeUsers.id" v-for="typeUsers of systemUsers">
                    <a-divider plain titlePlacement="start" class="mt-0">
                      {{ typeUsers.name }}
                    </a-divider>
                    <a-flex vertical gap="middle" class="group">
                      <a-flex
                        :class="'mb-md cursor-pointer transition-bg duration-300 ease-in-out p-xs rounded-lg group-hover:bg-layout ' + (isSelect(user, String(typeUsers.id)) ? 'bg-layout' : '')"
                        :key="user.id"
                        v-for="user of typeUsers.value"
                        align="top"
                        gap="small"
                        @click="onSelectedUser(user.id, typeUsers.id)"
                      >
                        <user-avatar :user="user" size="large"/>
                        <a-flex vertical flex="1">
                          <a-typography-text ellipsis strong="">
                            {{ AuthServerService.getPrincipalNameByUserDetails(user) }}
                          </a-typography-text>
                          <a-typography-text ellipsis type="secondary" class="text-sm">
                            <template v-if="user.phoneNumber">
                              {{ $t('common.phoneNumber') }}:
                              {{ user.phoneNumber }}
                            </template>
                            <template v-if="user.email">
                              , {{ $t('common.email') }}: {{ user.email }}
                            </template>
                          </a-typography-text>
                        </a-flex>
                      </a-flex>

                    </a-flex>
                  </template>
                </template>
                <captcha-send-button
                  ref="captchaSendButtonRef"
                  type="primary"
                  :captcha-type="resetPasswordForm.metadata.id as CaptchaTokenType"
                  :append="captchaAppend"
                  :before-send="beforeSend"
                  :disabled="isMultiUsers() && (!resetPasswordForm.userId || !resetPasswordForm.type)"
                  block
                  class="mb-md"
                  :countdown-format="$t('captcha.countdown')"
                  @sent="onCaptchaSent"
                >
                  <template #icon>
                    <icon-font :type="isMultiUsers() ? 'loncra-user-check' : 'loncra-lock-open'"/>
                  </template>
                  <span v-if="isMultiUsers()">
                    {{ $t('forgotPassword.step.multiUsersSelected.action') }}
                  </span>
                  <span v-else>
                    {{ $t('forgotPassword.step.sendCaptcha.action') }}
                  </span>
                </captcha-send-button>
                <a-flex justify="center" align="center">
                  <a-space-compact>
                    <a-button type="text"
                              @click="globalProperties.$router.push({name:authPageName})">
                      <template #icon>
                        <icon-font type="loncra-undo-2"/>
                      </template>
                      {{ $t('common.back') }}
                    </a-button>
                    <a-button type="text" v-if="generateCaptcha.result" @click="step = 2">
                      <template #icon>
                        <icon-font type="loncra-forward"/>
                      </template>
                      {{ $t('forgotPassword.step.backRestPassword') }}
                    </a-button>
                  </a-space-compact>
                </a-flex>
              </l-form>
            </template>
            <template v-if="step === 2">
              <a-alert type="info" show-icon>
                <template #description>
                  {{ $t('captcha.sendTo', {type:segmentedData.find(s => s.value === resetPasswordForm.metadata.id)?.label,target: resetPasswordForm.metadata.value}) }}
                  <a-typography-text type="secondary">{{$t('captcha.resend.prompt')}}</a-typography-text>
                  <a-statistic-timer
                    :classes="{root:'inline-block',content:'text-text-secondary text-DEFAULT'}"
                    @finish="() => resendCooling = false"
                    v-if="generateCaptcha.result && resendCooling"
                    :value="generateCaptcha.result.expired"
                    type="countdown"
                    :format="'(' + $t('captcha.countdown') + ')'"
                  />
                  <a-button v-else type="link" size="small" @click="captchaSendButtonRef?.trigger()">
                    {{$t('captcha.resend.action')}}
                  </a-button>
                </template>
              </a-alert>
              <l-form ref="resetPasswordFormRef"
                      @finish="resetPasswordFormRef.validate().then(() => submitRestPassword())"
                      :model="resetPasswordForm">
                <a-form-item
                  name="captchaValue"
                  :label="$t('captcha.text')"
                  :message-variables="{ label: $t('captcha.text') }"
                  :rules="[{required: true}]"
                >

                  <a-input-otp
                    class="flex justify-between"
                    v-model:value="resetPasswordForm.captchaValue"
                    input-mode="numeric"
                    :formatter="(value:string) => value.replace(/[^0-9]/g, '')"
                    :length="generateCaptcha.result?.codeLength"
                  />
                </a-form-item>
                <a-form-item name="newPassword" :label="$t('auth.newPassword')"
                             :rules="[{required: true, trigger: 'change'},{type: 'string', pattern: VALID_REGX.PASSWORD, message: $t('error.valid.password'), trigger: 'change'}]">
                  <a-input-password class="w-full" v-model:value="resetPasswordForm.newPassword"/>
                </a-form-item>
                <a-form-item name="confirmPassword"
                             :label="$t('common.confirmPassword')"
                             :rules="[{required: true, trigger: 'change'}, {validator: () => validatePassword(resetPasswordForm.newPassword,resetPasswordForm.confirmPassword), trigger: 'change'}]">
                  <a-input-password class="w-full"
                                    v-model:value="resetPasswordForm.confirmPassword"/>
                </a-form-item>
                <a-button type="primary" block html-type="submit" class="mb-lg">
                  <template #icon>
                    <icon-font class="icon" type="loncra-user-check"/>
                  </template>
                  {{ $t('systemSetting.account.modifyPassword') }}
                </a-button>
                <a-flex justify="center" align="center">
                  <a-button type="text" @click="step = 1">
                    <template #icon>
                      <icon-font type="loncra-undo-2"/>
                    </template>
                    {{ $t('common.back') }}
                  </a-button>
                </a-flex>
              </l-form>
            </template>
          </a-flex>
        </a-spin>
      </a-flex>
    </a-card>
  </a-flex>
</template>
