<script setup lang="ts">
import LForm from '@/components/Form.vue'
import {type ComponentInternalInstance, computed, getCurrentInstance, ref} from 'vue'
import {
  type AuthCredentials,
  type AuthFormProp,
  BusinessError,
  type CaptchaGenerationResult,
  type CaptchaToken,
  type LoginType
} from '@/types/apis'
import {usePrincipalStore} from '@/stores/principalStore'
import {useSocketStore} from '@/stores/socketStore'
import {AUTHENTICATION_TYPE, LOGIN_TYPE} from '@/constants/authConstant.js'
import {createIcon, requireNonNullOrUndefined} from '@/utils'
import {ResourceServerService} from "@/apis";

defineOptions({
  name: 'LAuthForm',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const principalStore = usePrincipalStore()
const socketStore = useSocketStore()

const props = withDefaults(defineProps<AuthFormProp>(), {
  enablePhoneAuth: true,
  enableQrCodeAuth: false,
})

const segmentedData = computed(() => {
  const result = [{
    label:globalProperties.$t('auth.accountLogin'),
    value: String(LOGIN_TYPE.USERNAME_PASSWORD),
    icon: createIcon('loncra-user', 'align'),
  }]
  if (props.enablePhoneAuth) {
    result.push({
      label:globalProperties.$t('auth.phoneLogin'),
      value: String(LOGIN_TYPE.PHONE_CAPTCHA),
      icon: createIcon('loncra-tablet-smartphone', 'align'),
    })
  }
  if (props.enableQrCodeAuth) {
    result.push({
      label:globalProperties.$t('auth.qrCodeLogin'),
      value: String(LOGIN_TYPE.QR_CODE),
      icon: createIcon('loncra-qr-code', 'align'),
    })
  }
  return result
})

const segmentedKey = ref<string>(LOGIN_TYPE.USERNAME_PASSWORD)

const formRef = ref()
const loading = ref(false)
const accountLoginCaptchaRef = ref<{
  instance?:any
  captchaToken?:CaptchaToken
}>({});

const sendPhoneNumberCaptchaRef = ref<{
  instance?:any
  sendPhoneNumber?:string,
  disabledSendButton?:boolean,
  captchaToken?:CaptchaToken
  sending?:boolean,
  result?:CaptchaGenerationResult
}>({});

const authForm = ref<AuthCredentials>({
  username: '',
  password: '',
  loginType: LOGIN_TYPE.USERNAME_PASSWORD,
})

function onAuth() {
  if (loading.value || sendPhoneNumberCaptchaRef.value.sending) {
    return
  }
  formRef.value.validate().then(onValidateThen)
}

async function onValidateThen() {

  if (accountLoginCaptchaRef.value.instance) {
    accountLoginCaptchaRef.value.instance.show()
  } else {
    await doAuth()
  }

}

const doAuth = async (): Promise<void> => {
  loading.value = true
  try {
    const data = await principalStore.login(authForm.value, AUTHENTICATION_TYPE.CONSOLE)

    if (data.authenticated) {
      socketStore.ensureConnected()
      globalProperties.$router.push('/')
      accountLoginCaptchaRef.value.captchaToken = undefined
      accountLoginCaptchaRef.value.instance = undefined
    }
  } catch (e) {
    if (!(e instanceof BusinessError)) {
      return
    }
    const error:BusinessError = (e as BusinessError)
    if (error.executeCode === "100429" && error.data) {
      accountLoginCaptchaRef.value.captchaToken = (error.data as {captchaToken:CaptchaToken}).captchaToken
      accountLoginCaptchaRef.value.instance = await ResourceServerService.createTianaiCaptchaInstance(
        accountLoginCaptchaRef.value.captchaToken,
        onAccountCaptchaSuccess
      )
    }
  } finally {
    loading.value = false
  }

}

function onAccountCaptchaSuccess(result: { data:string }) {
  if (!accountLoginCaptchaRef.value.captchaToken) {
    return
  }
  authForm.value = {
    ...authForm.value,
    ...ResourceServerService.createGenerateTokenParam(accountLoginCaptchaRef.value.captchaToken,{
      [(accountLoginCaptchaRef.value.captchaToken.args.post as {captchaParamName:string}).captchaParamName]:result.data
    })
  }

  accountLoginCaptchaRef.value.instance.hide()

  doAuth()
}

async function sendPhoneNumberCaptcha() {
  sendPhoneNumberCaptchaRef.value.sending = true
  try {
    const result = await ResourceServerService.sendPhoneNumberCaptcha(authForm.value.username, "system.sms.captcha.login")
    sendPhoneNumberCaptchaRef.value.captchaToken = result.token as CaptchaToken
    sendPhoneNumberCaptchaRef.value.disabledSendButton = true
    sendPhoneNumberCaptchaRef.value.result = result.generateResult as CaptchaGenerationResult
    sendPhoneNumberCaptchaRef.value.sendPhoneNumber = authForm.value.username
    authForm.value = {...authForm.value, ...ResourceServerService.createGenerateTokenParam(sendPhoneNumberCaptchaRef.value.captchaToken)}
  } finally {
    sendPhoneNumberCaptchaRef.value.sending = false
  }

}

function onOtpComplete() {
  if (loading.value || sendPhoneNumberCaptchaRef.value.sending) {
    return
  }
  onAuth()
}
</script>

<template>
  <a-spin :spinning="loading">
    <l-form id="authForm" ref="formRef" @finish="onAuth" :model="authForm" class="pb-lg pt-lg">
      <div class="mb-lg" v-if="segmentedKey === LOGIN_TYPE.USERNAME_PASSWORD">
        <a-form-item name="username" :label="$t('auth.account')" :rules="[{required: true}]">
          <a-input autocomplete="current-username" v-model:value="authForm.username"/>
        </a-form-item>
        <a-form-item name="password" :label="$t('auth.password')" :rules="[{required: true}]">
          <a-input-password autocomplete="current-password" v-model:value="authForm.password"/>
        </a-form-item>
      </div>
      <template v-else-if="segmentedKey === LOGIN_TYPE.PHONE_CAPTCHA">
        <a-form-item name="username" :label="$t('common.phoneNumber')" :rules="[{required: true}]">
          <a-space-compact block>
            <a-input autocomplete="current-username" @keydown.enter.prevent="sendPhoneNumberCaptcha()" v-model:value="authForm.username"/>
            <a-button
              @click="sendPhoneNumberCaptcha"
              :disabled="sendPhoneNumberCaptchaRef.disabledSendButton"
              :loading="sendPhoneNumberCaptchaRef.sending"
            >
              <template #icon v-if="!sendPhoneNumberCaptchaRef.disabledSendButton">
                <icon-font type="loncra-send"/>
              </template>
              <a-statistic-timer
                :classes="{content:'text-DEFAULT'}"
                @finish="() => sendPhoneNumberCaptchaRef.disabledSendButton = false"
                v-if="sendPhoneNumberCaptchaRef.result && sendPhoneNumberCaptchaRef.disabledSendButton"
                :value="sendPhoneNumberCaptchaRef.result.expired"
                type="countdown"
                :format="globalProperties.$t('captcha.countdown')"
              />
            </a-button>
          </a-space-compact>
        </a-form-item>
        <a-form-item v-if="sendPhoneNumberCaptchaRef.result" name="password" :label="globalProperties.$t('captcha.text')" :rules="[{required: true}]">
          <template #extra>
            <div class="mt-xs">
            {{globalProperties.$t('captcha.sendTo',{target:sendPhoneNumberCaptchaRef.sendPhoneNumber})}}
            </div>
          </template>
          <a-input-otp
            @change="onOtpComplete"
            class="flex justify-between"
            v-model:value="authForm.password"
            input-mode="numeric"
            :formatter="(value:string) => value.replace(/[^0-9]/g, '')"
            :length="sendPhoneNumberCaptchaRef.result.codeLength"
          />
        </a-form-item>
      </template>
      <a-button html-type="submit" block type="primary" :loading="sendPhoneNumberCaptchaRef.sending">
        <template #icon>
          <icon-font class="icon" type="loncra-log-in"/>
        </template>
        {{ globalProperties.$t('auth.login') }}
      </a-button>
    </l-form>
    <a-segmented block :options="segmentedData" v-model:value="segmentedKey" @change="(value:LoginType) => authForm.loginType = value" />

    <a-divider class="mt-0"/>
    <a-flex justify="space-between" align="center">
      <a-typography class="text-center">
        {{ globalProperties.$t('auth.noAccount') }}
        <a-typography-link>
          {{ globalProperties.$t('auth.createAccount') }}
        </a-typography-link>
      </a-typography>
      <a-typography-link href="/forgot/password">{{ globalProperties.$t('auth.forgotPassword') }}</a-typography-link>
    </a-flex>
  </a-spin>
</template>
