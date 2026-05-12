<script setup lang="ts">
import LForm from '@/components/Form.vue'
import {type ComponentInternalInstance, getCurrentInstance, ref} from 'vue'
import type {AuthCredentials} from '@/types'
import {usePrincipalStore} from '@/stores/principalStore'
import {AUTHENTICATION_TYPE, LOGIN_TYPE} from '@/constants/authConstant.js'
import {requireNonNullOrUndefined} from '@/utils'

defineOptions({
  name: 'LAuthForm',
})

export interface AuthFormProp {
  enablePhoneAuth?: boolean
  enableQrCodeAuth?: boolean
}

const props = withDefaults(defineProps<AuthFormProp>(), {
  enablePhoneAuth: true,
  enableQrCodeAuth: true,
})


const formRef = ref()

const authFormProps = ref<AuthCredentials>({
  username: '',
  password: '',
  loginType: LOGIN_TYPE.USERNAME_PASSWORD,
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties
const principalStore = usePrincipalStore()

const onAuth = (): void => {
  formRef.value.validate().then(() => doAuth())
}

const doAuth = async (): Promise<void> => {
  const data = await principalStore.login(authFormProps.value, AUTHENTICATION_TYPE.CONSOLE)
  if (data.authenticated) {
    globalProperties.$router.push('/')
  }
}
</script>

<template>
  <l-form id="authForm" ref="formRef" @finish="onAuth" :model="authFormProps" class="pb-lg pt-lg">
    <a-form-item name="username" :label="$t('auth.account')" :rules="[{required: true}]">
      <a-input autocomplete="current-username" v-model:value="authFormProps.username"/>
    </a-form-item>
    <a-form-item name="password" :label="$t('auth.password')" :rules="[{required: true}]">
      <a-input-password autocomplete="current-password" v-model:value="authFormProps.password"/>
    </a-form-item>
    <a-flex justify="space-between" align="center">
      <a-checkbox>{{ $t('auth.rememberMe') }}</a-checkbox>
      <a-typography-link>{{ $t('auth.forgotPassword') }}</a-typography-link>
    </a-flex>
    <a-button class="mt-lg" html-type="submit" block type="primary">
      <template #icon>
        <icon-font class="icon" type="icon-unlock"/>
      </template>
      {{ $t('auth.login') }}
    </a-button>
  </l-form>
  <a-space-compact block v-if="props.enablePhoneAuth || props.enableQrCodeAuth">
    <a-button block v-if="props.enablePhoneAuth">
      <template #icon>
        <icon-font class="icon" type="icon-mobile-phone-btn"/>
      </template>
      {{ $t('auth.phoneLogin') }}
    </a-button>
    <a-button block v-if="props.enableQrCodeAuth">
      <template #icon>
        <icon-font class="icon" type="icon-qr-code"/>
      </template>
      {{ $t('auth.qrCodeLogin') }}
    </a-button>
  </a-space-compact>

  <a-divider/>
  <a-typography class="text-center">
    {{ $t('auth.noAccount') }}
    <a-typography-link>
      {{ $t('auth.createAccount') }}
    </a-typography-link>
  </a-typography>
</template>
