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
    disabled: 'Disabled',
    type: 'Type',
    category: 'Category',
    back: 'Back',
    home: 'Home',
    parent: 'Parent',
    addChild: 'Add child',
    open: 'On',
    close: 'Off',
    border: 'Border',
    size: 'Size',
  },
  setting: {
    lang: 'Language',
    size: {
      large: 'Large',
      middle: 'Middle',
      small: 'Small',
    },
    theme: {
      text: 'Theme',
      dark: 'Dark mode',
      light: 'Light mode',
      system: 'Follow system',
    },
    home: {
      homeSiderWidth: 'Home sidebar width',
      homeCollapsedWidth: 'Home sidebar collapsed width',
    },
    colorSetting: {
      text: 'Color settings',
      colorPrimary: 'Brand color',
      colorSuccess: 'Success color',
      colorError: 'Error color',
      colorWarning: 'Warning color',
      active: {
        title: 'Active',
        subTitle:
          'In this color ramp, used for selected or pressed emphasis on dark or high-contrast surfaces.',
      },
      bg: {
        title: 'Soft background',
        subTitle:
          'Light tint in the same palette, often for weaker hierarchy or low-emphasis selection.',
      },
      bgHover: {
        title: 'Soft background (hover)',
        subTitle: 'Hover color paired with the soft background for interactive feedback.',
      },
      border: {
        title: 'Border',
        subTitle: 'Outline color in this ramp for sliders, inputs, and similar strokes.',
      },
      borderHover: {
        title: 'Border (hover)',
        subTitle: 'Border color on hover for buttons, sliders, and similar outlines.',
      },
      hover: {
        title: 'Hover',
        subTitle:
          'General hover accent in this ramp for surfaces or icons (not dedicated text color).',
      },
      colorText: {
        title: 'Text color',
        subTitle: 'Primary color for body text, secondary copy, and icons in this ramp.',
      },
      colorTextActive: {
        title: 'Text (active)',
        subTitle: 'Text or link color when active or selected.',
      },
      colorTextHover: {
        title: 'Text (hover)',
        subTitle: 'Text or link color on hover.',
      },
    },
  },
  form: {
    createSuccess: {
      title: 'Created successfully',
      subTitle: 'Choose an action below to continue.',
      okReturnList: 'Back to list',
      addAnother: 'Add another',
    },
  },
  error: {
    errorMessage: 'Error message',
    code: 'Error code',
    field: 'Field information',
    valid: {
      phoneNumber: 'Invalid phone number format',
    },
    badRequest: {
      title: 'Invalid parameters submitted',
    },
    forbidden: {
      title: "You don't have permission to access this resource. Please contact an administrator.",
    },
    notFound: {
      title: "The page you're looking for doesn't exist",
    },
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
    loading: 'Loading…',
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
      icon: 'Icon',
    },
    role: {
      removable: 'Can delete',
      modifiable: 'Can edit',
    },
  },
}

export default locale
