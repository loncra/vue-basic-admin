<script setup lang="ts">
import LForm from '@/components/Form.vue'
import {type ComponentInternalInstance, computed, getCurrentInstance, ref} from 'vue'
import {
  type AuthCredentials,
  type AuthFormProp,
  BusinessError,
  type CaptchaToken,
  type LoginType,
  type RestResult,
  type SmsCaptchaGenerationResult,
  type TimeProperties
} from '@/types/apis'
import {usePrincipalStore} from '@/stores/principalStore'
import {useSocketStore} from '@/stores/socketStore'
import {AUTHENTICATION_TYPE, LOGIN_TYPE} from '@/constants/authConstant.js'
import {createIcon, requireNonNullOrUndefined} from '@/utils'
import {ResourceServerService} from "@/apis";
import {CAPTCHA_TOKEN_TYPE} from "@/constants/messageConstant.ts";

defineOptions({
  name: 'LAuthForm',
})


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
  result?:SmsCaptchaGenerationResult
}>({});

const authForm = ref<AuthCredentials>({
  username: '',
  password: '',
  loginType: LOGIN_TYPE.USERNAME_PASSWORD,
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const principalStore = usePrincipalStore()
const socketStore = useSocketStore()

function onAuth() {
  if (loading.value || sendPhoneNumberCaptchaRef.value.sending) {
    return
  }
  formRef.value.validate().then(onValidateThen)
}

function onValidateThen() {
  if (accountLoginCaptchaRef.value?.instance) {
    accountLoginCaptchaRef.value.instance.show()
  } else {
    doAuth()
  }
}

const doAuth = async (): Promise<void> => {
  if (authForm.value.loginType === LOGIN_TYPE.PHONE_CAPTCHA && sendPhoneNumberCaptchaRef.value.captchaToken) {
    authForm.value = {...authForm.value, ...createPostCaptchaParam({data:null}, sendPhoneNumberCaptchaRef.value.captchaToken)}
  }
  loading.value = true
  try {
    const data = await principalStore.login(authForm.value, AUTHENTICATION_TYPE.CONSOLE)
    if (data.authenticated) {
      socketStore.ensureConnected()
      globalProperties.$router.push('/')
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
  authForm.value = {...authForm.value, ...createPostCaptchaParam(result, accountLoginCaptchaRef.value.captchaToken)}

  accountLoginCaptchaRef.value.instance.hide()

  doAuth()
}

async function sendPhoneNumberCaptcha() {
  try {
    loading.value = true
    const result:RestResult<CaptchaToken> = await ResourceServerService.generateCaptchaToken(CAPTCHA_TOKEN_TYPE.SMS)
    if (!result.data) {
      return
    }
    sendPhoneNumberCaptchaRef.value.captchaToken = result.data
    if (!sendPhoneNumberCaptchaRef.value.captchaToken.interceptToken) {
      const params = createPostPhoneNumberCaptchaParam()
      await doSendPhoneNumberCaptcha(params)
    } else if (sendPhoneNumberCaptchaRef.value.captchaToken.interceptToken.type === 'tianai') {
      sendPhoneNumberCaptchaRef.value.instance = await ResourceServerService.createTianaiCaptchaInstance(
        sendPhoneNumberCaptchaRef.value.captchaToken.interceptToken as CaptchaToken,
        onSendPhoneNumberCaptcha
      )
      sendPhoneNumberCaptchaRef.value.instance.show()
    }
  } finally {
    loading.value = false
  }

}

function onSendPhoneNumberCaptcha(result: { data:string }) {
  if (!sendPhoneNumberCaptchaRef.value.captchaToken) {
    return
  }
  const post = createPostPhoneNumberCaptchaParam()
  sendPhoneNumberCaptchaRef.value.sendPhoneNumber = post.phoneNumber
  const params = {
      ...createPostCaptchaParam(result, sendPhoneNumberCaptchaRef.value.captchaToken.interceptToken as CaptchaToken),
      ...post
  }
  sendPhoneNumberCaptchaRef.value.instance.hide()
  doSendPhoneNumberCaptcha(params)
}

function createPostPhoneNumberCaptchaParam() {
  if (!sendPhoneNumberCaptchaRef.value.captchaToken) {
    return {};
  }
  return  {
    captchaType:sendPhoneNumberCaptchaRef.value.captchaToken.type,
    messageType:'system.sms.captcha.login',
    phoneNumber:authForm.value.username,
    [sendPhoneNumberCaptchaRef.value.captchaToken.tokenParamName]: sendPhoneNumberCaptchaRef.value.captchaToken.token.name,
  }
}

async function doSendPhoneNumberCaptcha(params:Record<string,unknown>) {
  if (!sendPhoneNumberCaptchaRef.value.captchaToken) {
    return
  }
  try {
    sendPhoneNumberCaptchaRef.value.sending = true
    const sendResult:RestResult<Record<string, unknown>> = await ResourceServerService.generateCaptcha(params)
    if (sendResult.data) {
      sendPhoneNumberCaptchaRef.value.result = sendResult.data as {codeLength:number, expired:TimeProperties} as SmsCaptchaGenerationResult
      sendPhoneNumberCaptchaRef.value.disabledSendButton = true
    }
    console.info(sendPhoneNumberCaptchaRef.value.result)
  } finally {
    sendPhoneNumberCaptchaRef.value.sending = false
  }
}

function createPostCaptchaParam(result: { data:string | null | undefined}, captchaToken:CaptchaToken) {
  return {
    captchaType:captchaToken.type,
    [captchaToken.tokenParamName]: captchaToken.token.name,
    [(captchaToken.args.post as {captchaParamName:string}).captchaParamName]:result.data
  }
}
function onOtpComplete(value:string) {
  if (loading.value || sendPhoneNumberCaptchaRef.value.sending) {
    return
  }  // v-model 一般已同步，可省略
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
                :classes="{content:'text-sm'}"
                @finish="() => sendPhoneNumberCaptchaRef.disabledSendButton = false"
                v-if="sendPhoneNumberCaptchaRef.result && sendPhoneNumberCaptchaRef.disabledSendButton"
                :value="sendPhoneNumberCaptchaRef.result.expired"
                type="countdown"
                format="s 秒后可重试"
              />
            </a-button>
          </a-space-compact>
        </a-form-item>
        <a-form-item v-if="sendPhoneNumberCaptchaRef.result" name="password" :label="$t('captcha.text')" :rules="[{required: true}]">
          <template #extra>
            <div class="mt-xs">
            {{$t('captcha.sendTo',{target:sendPhoneNumberCaptchaRef.sendPhoneNumber})}}
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
        {{ $t('auth.login') }}
      </a-button>
    </l-form>
    <a-segmented block :options="segmentedData" v-model:value="segmentedKey" @change="(value:LoginType) => authForm.loginType = value" />

    <a-divider class="mt-0"/>
    <a-flex justify="space-between" align="center">
      <a-typography class="text-center">
        {{ $t('auth.noAccount') }}
        <a-typography-link>
          {{ $t('auth.createAccount') }}
        </a-typography-link>
      </a-typography>
      <a-typography-link>{{ $t('auth.forgotPassword') }}</a-typography-link>
    </a-flex>
  </a-spin>
</template>
