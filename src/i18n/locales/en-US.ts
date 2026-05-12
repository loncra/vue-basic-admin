import enUS from 'antdv-next/locale/en_US'
import type {LanguagePack} from '@/i18n'
import 'dayjs/locale/en'

const locale: LanguagePack = {
  value: 'en-US',
  fallbackLocale: false,
  name: 'English',
  dayjs: 'en',
  antDesign: enUS,
  common: {
    id: 'ID',
    save: 'Save',
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    export: 'Export',
    detail: 'Details',
    deleteSelected: 'Delete selected',
    operation: 'Actions',
    reset: 'Reset',
    deleteConfirm: 'Are you sure you want to delete the record [{name}]?',
    deleteConfirmTitle: 'Confirm deletion',
    deleteConfirmSingle: 'Are you sure you want to delete this record?',
    deleteConfirmBatch: 'Are you sure you want to delete {count} record(s)?',
    serverError: 'Server error. Please try again later.',
    confirmPassword: 'Confirm password',
    email: 'Email',
    phoneNumber: 'Phone number',
    status: 'Status',
    gender: 'Gender',
    remark: 'Remark',
    realName: 'Full name',
    name: 'Name',
    enabled: 'Enabled',
    type: 'Type',
    category: 'Category',
    back: 'Back',
    home: 'Home',
  },
  error: {
    errorMessage: 'Error message',
    code: 'Error code',
    field: 'Field information',
    badRequest: {
      title: 'Invalid parameters submitted',
    },
    forbidden: {
      title: "You don't have permission to access this resource. Please contact an administrator.",
    },
    notFound: {
      title: "The page you're looking for doesn't exist",
    },
    /** Edit tab activated but record no longer exists (e.g. deleted elsewhere) */
    staleEntityForm: {
      title: 'This page is no longer valid',
      subTitle:
        'This record could not be found. It may have been deleted elsewhere. Please open it again from the list.',
    },
  },
  search: {
    text: 'Search',
    placeholder: {
      input: 'Enter content to search',
      select: 'Select options to search',
    },
  },
  layoutContent: {
    pin: 'Pin',
    unpin: 'Unpin',
    reload: 'Reload',
    fullscreen: 'Enter fullscreen',
    exitFullscreen: 'Exit fullscreen',
    close: {
      others: 'Close other tabs',
      right: 'Close tabs to the right',
    },
  },
  profile: {
    logout: 'Sign out',
  },
  auth: {
    title: 'Out-of-the-box development foundation',
    subTitle:
      'Build enterprise apps quickly through configuration—development stays efficient and focused.',
    welcomeTitle: 'Welcome back 👋🏻',
    welcomeSubTitle: 'Enter your account details to get started.',
    account: 'Username',
    password: 'Password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    login: 'Sign in',
    phoneLogin: 'Sign in with phone',
    qrCodeLogin: 'QR code sign-in',
    noAccount: "Don't have an account?",
    createAccount: 'Create account',
    reLogin: 'Sign in again',
  },
  workbench: {
    personalActivity: 'Personal activity',
    quickAccess: 'Quick access',
  },
  ai: {
    greeting: 'Hi, {name}! How can I help you today?',
    models: 'Models',
    think: 'Deep reasoning',
    newChat: 'New chat',
    network: 'Web search',
    knowledge: 'Knowledge base search',
    send: 'Send',
    stop: 'Stop',
    history: 'Chat history',
    tool: {
      arguments: 'Request parameters',
      responseData: 'Response',
    },
    duration: 'Elapsed: {time} s',
    token: {
      total: 'Total tokens: {value}',
      prompt: 'Prompt tokens: {value}',
      completion: 'Completion tokens: {value}',
    },
  },
  authServer: {
    randomPassword: 'Random password',
    randomUsername: 'Random username',
    lastAuthenticationTime: 'Last sign-in time',
    authority: 'Permission code',
    source: 'Resource source',
    userRole: 'User roles',
    standaloneResource: 'Standalone resources',
    resource: {
      applicationName: 'Application name',
      page: 'Route path',
    },
    role: {
      removable: 'Can delete',
      modifiable: 'Can edit',
    },
  },
}

export default locale
