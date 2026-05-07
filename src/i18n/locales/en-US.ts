import enUS from 'antdv-next/locale/en_US'
import type { LanguagePack } from '@/i18n'
import 'dayjs/locale/en'

const locale: LanguagePack = {
  value: 'en-US',
  fallbackLocale: false,
  name: 'English',
  dayjs: 'en',
  antDesign: enUS,
  common: {
    edit: 'Edit',
    delete: 'Delete',
    searching: 'Searching...',
    deleteConfirm: 'Are you sure you want to delete the record [{name}]?',
    searchPlaceholder: 'Enter content to search',
    serverError: 'Server error, please try again later.',
  },
  auth: {
    title: 'Out-of-the-box Development Foundation',
    subTitle:
      'Generate through configuration, quickly build enterprise-level applications, making development more efficient and focused',
    welcomeTitle: 'Welcome back👋🏻',
    welcomeSubTitle: 'Please enter your account information to start using the system.',
    accountLabel: 'Login Account',
    passwordLabel: 'Login Password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    login: 'Log in',
    phoneLogin: 'Phone Login',
    qrCodeLogin: 'QR Code Login',
    noAccount: "Don't have an account?",
    createAccount: 'Create account',
  },
  workbench: {
    personalActivity: 'Personal Activity',
    quickAccess: 'Quick Access',
  },
  ai: {
    greeting: 'Hi! {name}, how can I help you today?',
    models: 'Models',
    think: 'Deep Think',
    newChat: 'New Topic',
    network: 'Network Search',
    knowledge: 'Knowledge Base Search',
    send: 'Send',
    stop: 'Stop',
    history: 'Chat History',
    tool: {
      arguments: 'Request Parameters',
      responseData: 'Response Result',
    },
    duration: 'Time spent: {time} seconds',
    token: {
      total: 'Total tokens consumed: {value}',
      prompt: 'Input prompt tokens: {value}',
      completion: 'Response tokens: {value}',
    },
  },
}

export default locale
