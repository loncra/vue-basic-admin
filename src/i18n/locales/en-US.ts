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
    setting: 'Settings',
    me: 'Me',
    creationTime: 'Created at',
    ip: 'IP address',
    noMore:'No more data available',
    system: 'System information',
    save: 'Save',
    add: 'Add {name}',
    edit: 'Edit {name}',
    all: 'All {name}',
    export: {
      all: 'Export all',
      selected: 'Export ({count}) record(s)',
    },
    used:'Used',
    link:'Link URL',
    detail: '{name} details',
    action: 'Actions',
    reset: 'Reset',
    accept:'accept',
    rejected:'rejected',
    ignore:'ignore',
    rename:'Rename',
    copy:'Copy',
    read: {
      time: 'Read time',
      readable: 'Unread {count}',
      unreadable: 'Read {count}',
    },
    delete: {
      text: 'Delete',
      selected: 'Delete ({count}) record(s)',
      confirmTitle: 'Confirm deletion',
      confirmSingle: 'Are you sure you want to delete this record?',
      confirmBatch: 'Are you sure you want to delete {count} record(s)?',
    },
    title: 'Title',
    serverError: 'Server error. Please try again later.',
    confirmPassword: 'Confirm password',
    email: 'Email',
    phoneNumber: 'Phone number',
    status: 'Status',
    content: 'Content',
    gender: 'Gender',
    remark: 'Remark',
    unSupport:'Your browser does not support this operation',
    realName: 'Full name',
    send: 'Send {name}',
    name: 'Name',
    enabled: 'Enabled',
    verified: 'Verified {name}',
    disabled: 'Disabled',
    type: 'Type',
    category: 'Category',
    back: 'Back',
    home: 'Home',
    parent: 'Parent',
    addChild: 'Add {name} child',
    open: 'On',
    close: 'Off',
    border: 'Border',
    size: 'Size',
    lang: 'Language',
    style: 'Style',
    other: 'Other',
    owner: 'Owner',
    rememberOperate: 'Remember my choice',
    default: 'Default',
    basicInformation: 'Basic information',
    request: {
      header: 'Request header',
      parameter: 'Request parameters',
      body: 'Request body',
    },
    cover: 'Cover',
    sort: 'Sort order',
    value: 'Value',
    unname: 'Untitled',
    clear: 'Clear',
    executeStatus: 'Execution status',
    successTime: 'Success time',
    completionTime: 'Completion time',
    expiresTime: 'Expiration time',
    auditionTime: 'Review time',
    code: 'Code',
    retry: {
      time: 'Retry time',
      count: 'Retry count',
    },
    channel: 'Channel',
    download: {
      text: 'Download',
      selected: 'Download selected ({count}) record(s)',
    },
    release: {
      text: 'Publish',
      selected: 'Publish ({count}) record(s)',
      confirmTitle: 'Confirm publish',
      confirmSingle: 'Are you sure you want to publish this record?',
      confirmBatch: 'Are you sure you want to publish {count} record(s)?',
    },
    revoke: {
      text: 'Revoke',
      selected: 'Revoke ({count}) record(s)',
      confirmTitle: 'Confirm revoke',
      confirmSingle: 'Are you sure you want to revoke this record?',
      confirmBatch: 'Are you sure you want to revoke {count} record(s)?',
    },
  },
  operation: {
    time: 'Operation time',
    principal: 'Operator account',
    type: 'Operation type',
    data: 'Operation data',
  },
  systemSetting: {
    componentSize: 'Default component size',
    wireframe: 'Wireframe',
    compact: 'Compact',
    createSuccessBack: 'After creating a record',
    borderRadius: 'Border radius',
    boxShadow: {
      text: 'Shadow',
      secondary: 'Level 2 box shadow',
      tertiary: 'Level 3 box shadow',
    },
    font: {
      text: 'Font size',
      heading: 'Heading {number} font size',
    },
    lineHeight: {
      text: 'Line height',
      heading: 'Line height for heading {number} text',
    },
    margin: 'Outer spacing',
    padding: 'Inner spacing',
    size: {
      common: 'General sizes',
      large: 'Large',
      middle: 'Middle',
      small: 'Small',
      lg: 'Large',
      md: 'Medium-large',
      sm: 'Medium-small',
      xl: 'Extra large',
      xs: 'Small',
      xxl: 'Extra extra large',
      xxs: 'Extra extra small',
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
    other: {
      transparency: {
        text: 'Opacity',
        loading: 'Loading state opacity',
        image: 'Image opacity',
      },
    },
    colorSetting: {
      text: 'Colors',
      prepare: 'Preset colors',
      colorPrimary: 'Brand color',
      colorSuccess: 'Success color',
      colorError: 'Error color',
      colorWarning: 'Warning color',
      other: {
        blue: 'Blue',
        purple: 'Purple',
        cyan: 'Cyan',
        red: 'Red',
        orange: 'Orange',
        yellow: 'Yellow',
        green: 'Green',
        magenta: 'Magenta',
        pink: 'Pink',
        volcano: 'Volcano',
        geekblue: 'Geek blue',
        lime: 'Lime',
        gold: 'Gold',
      },
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
    account: {
      avatar: {
        supportFormat: 'Only JPEG, PNG, JPG, and BMP images are supported',
        supportSize: 'Image must be smaller than 1 MB',
        history: 'History avatars',
      },
      modifyPassword: 'Change password',
    },
    tab: {
      accountSetting: 'Account settings',
      configProviderSetting: 'System settings',
    },
  },
  form: {
    operationDataTrace: 'Operation history',
    createSuccess: {
      title: 'Created successfully',
      subTitle: 'Choose an action below to continue.',
      okReturnList: 'Back to list',
      addAnother: 'Add another',
    },
  },
  error: {
    notNull: 'Cannot be empty',
    errorMessage: 'Error message',
    code: 'Error code',
    field: 'Field information',
    unSupport: {
      userMedia:'The current browser does not support user media access'
    },
    valid: {
      phoneNumber: 'Invalid phone number format',
      password:
        'Password must include at least three of: uppercase letters, lowercase letters, digits, and symbols',
    },
    notEq: '{target} does not match {source}',
    badRequest: {
      page: 'Invalid parameters',
      title: 'The parameters you submitted are invalid',
    },
    forbidden: {
      page: 'Access denied',
      title: "You don't have permission to access this resource. Please contact an administrator.",
    },
    notFound: {
      page: 'Page not found',
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
  attachment: {
    text: 'Attachment',
    uploading: 'Uploading{percent}',
    dragger: {
      title: 'Click or drag files to this area to upload',
      subTitle: 'Up to {maxCount} file(s); {count} uploaded',
    },
    type:{
      image:'image',
      video:'video',
      audio:'audio',
      unknown:'file'
    }
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
    principal: 'User information',
    account: 'Sign-in account',
    password: 'Password',
    oldPassword: 'Current password',
    newPassword: 'New password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    login: 'Sign in',
    log: 'Sign-in log',
    phoneLogin: 'Sign in with phone',
    qrCodeLogin: 'QR code sign-in',
    accountLogin: 'Sign in with account',
    noAccount: "Don't have an account?",
    createAccount: 'Create account',
    reLogin: 'Sign in again',
    page: 'Sign in',
  },
  captcha:{
    text:'captcha',
    sendTo:'The verification code has been sent to {target}. Please check your inbox',
    countdown:'Can retry after s seconds',
    resend:{
      prompt:'Didn\'t get it?',
      action:'Resend'
    }
  },
  forgotPassword:{
    title:'🔒Forgot password? ',
    subSelectTypeTitle:'Choose email or phone number to retrieve, we will send instructions for resetting the password',
    step:{
      sendCaptcha:{
        action:'Retrieve password',
        subTitle:'Choose email or phone number to retrieve, and we will send instructions for resetting the password.',
      },
      backRestPassword:'Reset Password',
      multiUsersSelected:{
        subTitle:'The system has found multiple accounts under {type}: {target}. Please select the account that needs to retrieve the password.',
        action:'Confirm'
      }
    },
  },
  workbench: {
    personalActivity: 'Personal activity',
    quickAccess: 'Quick access',
  },
  authServer: {
    deviceIdentified: 'Device identifier',
    randomPassword: 'Use random password',
    randomUsername: 'Use random username',
    lastAuthenticationTime: 'Last sign-in time',
    authority: 'Permission code',
    source: 'Resource source',
    userRole: 'User roles',
    standaloneResource: 'Standalone resources',
    resource: {
      applicationName: 'Application name',
      page: 'Route path',
      icon: 'Icon',
      routePage: 'Permissions',
    },
    auditEvent: {
      type: 'Audit type',
      target: 'Audit target',
      traceId: 'Related business ID',
    },
    consoleUser: {
      routePage: 'Employees',
    },
    role: {
      routePage: 'Roles',
      removable: 'Can delete',
      modifiable: 'Can edit',
    },
  },
  resourceServer: {
    dataDictionary: {
      valueType: 'Value type',
      level: 'Level',
      routePage: 'Dictionary data',
      editPage: 'Type: {typeName}, Name: {dataName}',
    },
    dictionaryType: {
      routePage: 'Dictionary types',
    },
    attachment: {
      filename: 'File name',
      fileSize: 'File size',
      lastModified: 'Last modified',
    },
    carousel: {
      image: 'Image content',
      dataContent: 'Data content',
      routePage: 'Carousel',
      link: 'Link',
      showtime: 'Display time',
      immediately: 'Immediately',
      permanent: 'Permanent',
    },
  },
  aiServer: {
    modelSetting: {
      routePage: 'Model settings',
      model: 'Model id',
      manufacturer: 'Manufacturer',
      description: 'Description',
      icon: 'Icon',
      defaultOptions: 'Default generate options',
      options: {
        temperature: {
          label: 'Temperature',
          help: 'Controls randomness. Typical 0.2–0.8; lower is steadier/factual, higher is more creative. E.g. support/extraction 0.2, creative writing 0.7.',
        },
        topP: {
          label: 'Top-p (nucleus)',
          help: 'Sample from the smallest set whose cumulative probability ≥ P. Typical 0.9–1. Usually tune either temperature or top-p, not both aggressively.',
        },
        topK: {
          label: 'Top-k',
          help: 'Restrict each step to the K highest-probability tokens. E.g. 40–100; smaller is stabler, larger is more diverse. Some vendors may ignore it.',
        },
        maxTokens: {
          label: 'Max tokens',
          help: 'Max tokens in one reply (including punctuation). E.g. short answers 512, long text 2048–4096. Too small truncates output.',
        },
        maxCompletionTokens: {
          label: 'Max completion tokens',
          help: 'Completion-length cap on some OpenAI-compatible APIs (similar to maxTokens). Fill the one your vendor accepts.',
        },
        frequencyPenalty: {
          label: 'Frequency penalty',
          help: 'Reduce repetition of tokens already used. Typical range -2–2. E.g. 0.2–0.5 against loops; too high sounds stiff.',
        },
        presencePenalty: {
          label: 'Presence penalty',
          help: 'Encourage new topics. Typical range -2–2. E.g. 0.3–0.6 for brainstorming; keep 0 when staying on-topic.',
        },
        seed: {
          label: 'Seed',
          help: 'Fixed integer for more reproducible runs (evals/compare). E.g. 42. Empty = random; not guaranteed identical across vendors.',
        },
        thinkingBudget: {
          label: 'Thinking budget',
          help: 'Token budget for reasoning/thinking. E.g. DashScope 2048 enables thinking; empty usually skips the thinking path.',
        },
        reasoningEffort: {
          label: 'Reasoning effort',
          help: 'How hard the model reasons: often low / medium / high. E.g. simple Q&A low; complex analysis medium or high.',
        },
        cacheControl: {
          label: 'Cache control',
          help: 'Enable prompt/context caching when supported. Useful for long system prompts and reused prefixes to cut latency/cost.',
        },
        parallelToolCalls: {
          label: 'Parallel tool calls',
          help: 'Allow multiple tools in one turn. Good for independent lookups; choose No when tools must run sequentially.',
        },
        stream: {
          label: 'Streaming',
          help: 'Default to streamed responses. Prefer Yes for chat UIs; No when you only need the full result (batch jobs).',
        },
      },
    },
  },
  messageServer: {
    sms: {
      routePage: 'SMS messages',
      template: {
        routePage: 'SMS templates',
        code: 'SMS template',
      },
      sign: {
        routePage: 'SMS signatures',
        code: 'SMS signature',
      },
      variable: {
        title: 'Template variables',
      },
    },
    site: {
      pushable: 'Push enabled',
      routePage: 'Site messages',
      readable: 'Read status',
      readCount: 'Read count {count}',
      channel: 'Push channel',
      deleteRead: 'Delete read',
      readAll: 'Mark all as read',
    },
    email: {
      routePage: 'Email messages',
      fromEmail: 'From email',
      receiveEmail: 'To email',
    },
    batch: {
      routePage: 'Batch messages',
      count: 'Total sent',
      successNumber: 'Success count {count}',
      failNumber: 'Failure count {count}',
    },
  },
  component: {
    tiptap: {
      undo: 'Undo',
      redo: 'Redo',
      picture: {
        text: 'Image',
        label: 'Image URL',
      },
      bold: 'Bold',
      italic: 'Italic',
      underline: 'Underline',
      blockquote: 'Quote',
      text: 'Body text',
      link: {
        text: 'Link',
      },
      title: 'Heading {number}',
      list: {
        none: 'No list',
        bullet: 'Bullet list',
        ordered: 'Ordered list',
      },
      align: {
        left: 'Align left',
        center: 'Align center',
        right: 'Align right',
      },
    },
    systemUserPanel:{
      selectedMember:'Selected Member'
    }
  },
  chat: {
    emoji: {
      smileys_emotion: 'Smileys & Emotion',
      people_body: 'People & Body',
      animals_nature: 'Animals & Nature',
      food_drink: 'Food & Drink',
      travel_places: 'Travel & Places',
      activities: 'Activities',
      objects: 'Objects',
      symbols: 'Symbols',
      flags: 'Flags',
    },
    call: {
      video:{
        action:'Video Call',
        title: 'video call with {principal}'
      },
      voice:{
        action:'Voice Call',
        title: 'voice call with {principal}'
      },
      invitation:'{user} invites you {type}',
      closeCountdown:'The call has ended and will automatically close after s seconds',
      reconnectTimeCountdown:'(The call will automatically end after s seconds)',
    },
    conversation: {
      delete: 'Delete conversation',
      newMessage:'There are {count} unread messages',
      draft:'draft',
      mention:'{count} mentioned you in the message'
    },
    pinned: {
      action: 'Pin chat',
      cancel: 'Unpin chat',
    },
    everyone:'Everyone',
    notification:{
      mention:'{principal} mentioned you in the message'
    },
    muted: {
      action: 'Mute notifications',
      cancel: 'Unmute notifications',
    },
    history: 'Chat history',
    view: {
      reference:'reference',
      reedit:'re-edit',
      selfUndo:'You have undo this message',
      undo:{
        confirmTitle:'Undo Confirmation',
        confirmContent:'Are you sure you want to undo this message?',
        action:'undo',
        messageValue: 'this message has been undo',
        countdown: '(Irrevocable after s seconds)'
      },
      placeholder: {
        exitRoom: 'You have left this group',
        roomRemove: 'You were removed from this group',
        disbandRoom: 'This group has been disbanded',
        text: 'Type a message; paste files here to send attachments',
      },
      readable:{
        jumpTo:'Jump to the earliest unread message',
        systemMessage:'The following are the earliest unread messages'
      }
    },
    roomView: {
      addParticipant: 'Start group chat',
      memberManager: 'Manage members',
      histories:{
        title:'Chat histories with {name}',
        positioning:'Position until chat'
      },
      exitRoom: {
        title: 'Withdrawal Confirmation',
        content: 'Are you sure you want to leave {name}?',
        action: 'Leave group',
      },
      disbandRoom: {
        title: 'Dissolution Confirmation',
        content: 'Are you sure you want to disband {name}?',
        action: 'Disband group',
      },
      modal: {
        changeMember: 'Set as member',
        changeCoOwner: 'Set as co-admin',
        removeMember: {
          confirmTitle: 'Removal Member Confirmation',
          content: 'Remove {count} selected member(s)?',
          action: 'Remove members',
        },
      },
    },
  },
  agent: {
    creation: 'Create agent',
    token:{
      text:'text',
      input:'input',
      output:'output',
      cache:'cache',
      total:'total',
      cacheHitRate:'cache hit rate',
    },
    workspace:{
      title:'Workspace',
      createPlaceholder: 'workspace name',
    },
    think:'think',
    oolCall:{
      text:'Tool call',
      hitl:{
        allow:'allow',
        reject:'reject'
      }
    },
    welcome: {
      title: 'Hello, I am Captain.J',
      description: 'What do you need to do today?'
    },
    view: {
      placeholder: 'Ask the agent…',
    },
  },
}

export default locale
