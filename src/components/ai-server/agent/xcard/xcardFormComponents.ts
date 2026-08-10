import {computed, defineComponent, h, inject, type PropType, type Ref} from 'vue'
import {Button, Checkbox, Input, Select} from 'antdv-next'

export const XCARD_FORM_STATE_KEY = 'agentXcardFormState'

type FormState = Ref<Record<string, unknown>>

function useFormState() {
  return inject<FormState | undefined>(XCARD_FORM_STATE_KEY, undefined)
}

function normalizePath(bindPath?: string, valuePath?: string): string | undefined {
  const raw = bindPath || valuePath
  if (!raw) {
    return undefined
  }
  return String(raw).replace(/^\//, '')
}

export const Panel = defineComponent({
  name: 'Panel',
  setup(_, {slots}) {
    return () => h('div', {class: 'l-xcard-panel flex flex-col gap-sm'}, slots.default?.())
  },
})

export const Text = defineComponent({
  name: 'Text',
  props: {
    text: {type: [String, Number], default: ''},
  },
  setup(props) {
    return () => h('div', {class: 'l-xcard-text text-text-secondary'}, String(props.text ?? ''))
  },
})

export const TextField = defineComponent({
  name: 'TextField',
  props: {
    label: {type: String, default: ''},
    value: {type: [String, Number], default: ''},
    bindPath: {type: String, default: ''},
    path: {type: String, default: ''},
    onDataChange: {type: Function as PropType<(path: string, value: unknown) => void>},
  },
  setup(props) {
    const formState = useFormState()
    const key = computed(() => normalizePath(props.bindPath))
    return () => {
      const k = key.value
      const fromState = k && formState?.value ? formState.value[k] : undefined
      const rawValue = fromState !== undefined
        ? fromState
        : (typeof props.value === 'string' && props.value.startsWith('/') ? '' : props.value)
      const current = rawValue ?? ''
      return h('div', {class: 'l-xcard-field'}, [
        props.label ? h('div', {class: 'mb-xxs text-sm'}, props.label) : null,
        h(Input, {
          value: current as string,
          allowClear: true,
          'onUpdate:value': (v: string) => {
            if (k && formState?.value) {
              formState.value[k] = v
            }
            if (k) {
              props.onDataChange?.('/' + k, v)
            }
          },
        }),
      ])
    }
  },
})

export const SelectField = defineComponent({
  name: 'SelectField',
  props: {
    label: {type: String, default: ''},
    value: {type: [String, Number], default: undefined},
    bindPath: {type: String, default: ''},
    path: {type: String, default: ''},
    options: {type: Array as PropType<string[]>, default: () => []},
    onDataChange: {type: Function as PropType<(path: string, value: unknown) => void>},
  },
  setup(props) {
    const formState = useFormState()
    const key = computed(() => normalizePath(props.bindPath))
    return () => {
      const k = key.value
      const current = props.value
        ?? (k && formState?.value ? formState.value[k] : undefined)
      return h('div', {class: 'l-xcard-field'}, [
        props.label ? h('div', {class: 'mb-xxs text-sm'}, props.label) : null,
        h(Select, {
          value: current,
          class: 'w-full',
          allowClear: true,
          options: (props.options || []).map(o => ({label: o, value: o})),
          'onUpdate:value': (v: string) => {
            if (k && formState?.value) {
              formState.value[k] = v
            }
            if (k) {
              props.onDataChange?.('/' + k, v)
            }
          },
        }),
      ])
    }
  },
})

export const CheckboxField = defineComponent({
  name: 'CheckboxField',
  props: {
    label: {type: String, default: ''},
    value: {type: [Boolean, Array] as PropType<boolean | string[]>, default: false},
    bindPath: {type: String, default: ''},
    path: {type: String, default: ''},
    options: {type: Array as PropType<string[]>, default: () => []},
    onDataChange: {type: Function as PropType<(path: string, value: unknown) => void>},
  },
  setup(props) {
    const formState = useFormState()
    const key = computed(() => normalizePath(props.bindPath))
    return () => {
      const k = key.value
      if (props.options?.length) {
        return h('div', {class: 'l-xcard-field'}, [
          props.label ? h('div', {class: 'mb-xxs text-sm'}, props.label) : null,
          h(Checkbox.Group, {
            value: (props.value as string[])
              ?? (k && formState?.value ? formState.value[k] as string[] : [])
              ?? [],
            options: props.options,
            'onUpdate:value': (v: string[]) => {
              if (k && formState?.value) {
                formState.value[k] = v
              }
              if (k) {
                props.onDataChange?.('/' + k, v)
              }
            },
          }),
        ])
      }
      return h('div', {class: 'l-xcard-field'}, [
        h(Checkbox, {
          checked: Boolean(props.value ?? (k && formState?.value ? formState.value[k] : false)),
          'onUpdate:checked': (v: boolean) => {
            if (k && formState?.value) {
              formState.value[k] = v
            }
            if (k) {
              props.onDataChange?.('/' + k, v)
            }
          },
        }, () => props.label),
      ])
    }
  },
})

export const ActionButton = defineComponent({
  name: 'ActionButton',
  props: {
    label: {type: String, default: 'Submit'},
    action: {type: Object, default: undefined},
    onAction: {type: Function as PropType<(name: string, context: Record<string, unknown>) => void>},
  },
  setup(props) {
    const formState = useFormState()
    return () => h(Button, {
      type: String(props.action?.event?.name || '').includes('cancel') ? 'default' : 'primary',
      class: 'xcard-action-btn',
      onClick: () => {
        const name = props.action?.event?.name
        if (!name) {
          return
        }
        props.onAction?.(name, {...(formState?.value || {})})
      },
    }, () => props.label)
  },
})

export const AGENT_XCARD_COMPONENTS = {
  Panel,
  Text,
  TextField,
  SelectField,
  CheckboxField,
  ActionButton,
}
