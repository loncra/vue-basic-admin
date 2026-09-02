<script setup lang="ts">
import LForm from '@/components/Form.vue'
import {type ComponentInternalInstance, computed, getCurrentInstance, onMounted, ref} from 'vue'
import {
  type AuthCredentials,
  type AuthenticationType,
  type AuthFormProp,
  BusinessError,
  type CaptchaGenerationResult,
  type CaptchaToken,
  type LoginType,
  type RestResult
} from '@/types/apis'
import {usePrincipalStore} from '@/stores/principalStore'
import {useSocketStore} from '@/stores/socketStore'
import {AUTHENTICATION_TYPE, CAPTCHA_TOKEN_TYPE, LOGIN_TYPE, VALID_REGX} from '@/constants'
import {createIcon, requireNonNullOrUndefined, validatePassword} from '@/utils'
import {ResourceServerService} from "@/apis";
import type {TianaiCaptchaInstance} from "../../../../env";
import useApp from "antdv-next/dist/app/useApp";

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

const {message} = useApp()

const authenticationType = computed<AuthenticationType>(() => String(globalProperties.$route.params.authenticationType || AUTHENTICATION_TYPE.CONSOLE).toUpperCase() as AuthenticationType)

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

const registerSubTitleMap = computed<Record<string, string>>(() => ({
  [LOGIN_TYPE.PHONE_CAPTCHA]:globalProperties.$t('auth.register.phoneSubtitle'),
  [LOGIN_TYPE.USERNAME_PASSWORD]:globalProperties.$t('auth.register.accountSubtitle')
}))

const description = computed(() => ({
  title:register.value ? globalProperties.$t('auth.register.title') : globalProperties.$t('auth.welcome.title'),
  subTitle:register.value ? registerSubTitleMap.value[segmentedKey.value] || '' : globalProperties.$t('auth.welcome.subTitle')
}))

const segmentedKey = ref<string>(LOGIN_TYPE.USERNAME_PASSWORD)

const formRef = ref()
const loading = ref(false)
const register = ref(false)

const accountLoginCaptchaRef = ref<{
  instance?:TianaiCaptchaInstance
  captchaToken?:CaptchaToken
}>({});

const sendPhoneNumberCaptchaRef = ref<{
  instance?:TianaiCaptchaInstance
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
  } else if (register.value) {
    loading.value = true
    const result:RestResult<CaptchaToken> = await ResourceServerService.generateCaptchaToken(CAPTCHA_TOKEN_TYPE.TIANAI)
    if (!result.data) {
      message.error(globalProperties.$t('error.global'))
      return
    }
    accountLoginCaptchaRef.value.captchaToken = result.data
    accountLoginCaptchaRef.value.instance = await ResourceServerService.createTianaiCaptchaInstance(
      accountLoginCaptchaRef.value.captchaToken,
      onAccountCaptchaSuccess,
      () => {
        loading.value = false
        accountLoginCaptchaRef.value.instance?.hide()
      }
    )
    if (!accountLoginCaptchaRef.value.instance) {
      message.error(globalProperties.$t('error.global'))
      return
    }
    accountLoginCaptchaRef.value.instance.show()
  } else {
    await doAuth()
  }
}

const doAuth = async (): Promise<void> => {
  loading.value = true
  if (register.value && authForm.value.loginType === LOGIN_TYPE.USERNAME_PASSWORD) {
    authForm.value.loginType = LOGIN_TYPE.USERNAME_PASSWORD_REGISTER
  }
  try {
    const data = await principalStore.login(authForm.value, authenticationType.value)

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
        onAccountCaptchaSuccess,
        () => {}
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

  accountLoginCaptchaRef.value.instance?.hide()

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

onMounted(() => register.value = globalProperties.$route.query.register === 'true')
</script>

<template>
  <a-spin :spinning="loading">
    <a-flex vertical gap="middle">
      <a-typography-title :level="2">
        {{ description.title }}
      </a-typography-title>
      <a-typography-text type="secondary">{{ description.subTitle }}</a-typography-text>

      <a-segmented block :options="segmentedData" v-model:value="segmentedKey" @change="(value:LoginType) => authForm.loginType = value" />

      <l-form id="authForm" ref="formRef" @finish="onAuth" :model="authForm">
        <div class="mb-lg" v-if="segmentedKey === LOGIN_TYPE.USERNAME_PASSWORD">
          <a-form-item name="username" :label="$t('auth.account')" :rules="[{required: true}]">
            <a-input autocomplete="current-username" v-model:value="authForm.username"/>
          </a-form-item>
          <a-form-item name="password" :label="$t('auth.password')" :rules="[{required: true}, register ? {type: 'string', pattern: VALID_REGX.PASSWORD, message: globalProperties.$t('error.valid.password')} : {}]">
            <a-input-password autocomplete="current-password" v-model:value="authForm.password"/>
          </a-form-item>
          <a-form-item
            v-if="register"
            :label="globalProperties.$t('common.confirmPassword')"
            name="confirmPassword"
            :rules="[
              {required: true, trigger: 'change'},
              {validator: (_rule: unknown, value: string) => validatePassword(value, authForm.password, 'auth.password'), trigger: 'change'}
              ]">
            <a-input-password v-model:value="authForm.confirmPassword" autocomplete="confirm-password"/>
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
        <a-button html-type="submit" block type="primary" :disabled="loading" :loading="sendPhoneNumberCaptchaRef.sending">
          <template #icon>
            <icon-font class="icon" :type="register ? 'loncra-id-card' : 'loncra-log-in'"/>
          </template>
          {{ register ? globalProperties.$t('auth.register.action') : globalProperties.$t('auth.welcome.action') }}
        </a-button>
      </l-form>

      <a-divider class="m-0"/>
      <template v-if="authenticationType === AUTHENTICATION_TYPE.PERSONAL">
        <a-flex justify="space-between" align="center" v-if="!register" >
          <a-typography class="text-center" >
            {{ globalProperties.$t('auth.noAccount') }}
            <a-typography-link @click="register = !register">
              {{ globalProperties.$t('auth.createAccount') }}
            </a-typography-link>
          </a-typography>
          <!--      <a-typography-link v-else @click="register = !register">
                  {{ globalProperties.$t('auth.reLogin') }}
                </a-typography-link>-->
          <a-typography-link href="/forgot/password">{{ globalProperties.$t('auth.forgotPassword') }}</a-typography-link>
        </a-flex>
        <a-button block v-else @click="register = !register">
          <template #icon>
            <icon-font class="icon" type="loncra-log-in"/>
          </template>
          {{ globalProperties.$t('auth.reLogin') }}
        </a-button>
      </template>
      <div v-else-if="authenticationType === AUTHENTICATION_TYPE.CONSOLE" class="text-center">
        <a-typography-link href="/forgot/password">{{ globalProperties.$t('auth.forgotPassword') }}</a-typography-link>
      </div>
    </a-flex>
  </a-spin>
</template>
