<script setup lang="ts">
import type {
  IconfontGlyph,
  IconfontJson,
  IconSelectAvatarModeValueType,
  IconSelectModeType
} from "@/types/composables";
import {type ComponentInternalInstance, computed, getCurrentInstance, ref, watch} from "vue";
import {AVATAR_SCHEMES, ICON_SELECT_AVATAR_MODE_VALUE, ICON_SELECT_MODE} from "@/constants";
import type {VueNode} from "antdv-next/dist/_util/type";
import {requireNonNullOrUndefined} from "@/utils";

defineOptions({
  name: 'LIconSelect',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const props = withDefaults(defineProps<{
  options?: IconfontJson[]
  mode?:IconSelectModeType
  preview?:boolean
}>(), {
  mode: ICON_SELECT_MODE.VIEW,
  preview:false,
  options:() => []
})

const state = ref<{
  avatarType:IconSelectAvatarModeValueType
  search: {
    dataSource: IconfontJson[]
    text: string
  }
}>({
  avatarType:ICON_SELECT_AVATAR_MODE_VALUE.AVATAR,
  search: {
    dataSource: [],
    text: "",
  }
})

const avatarOptions = computed<{ label: VueNode | string; value: string }[]>(() => [{
  label: globalProperties.$t("common.link"),
  value: ICON_SELECT_AVATAR_MODE_VALUE.AVATAR
},{
  label: globalProperties.$t("common.icon"),
  value: ICON_SELECT_AVATAR_MODE_VALUE.ICON
},{
  label: globalProperties.$t("common.name"),
  value: ICON_SELECT_AVATAR_MODE_VALUE.INPUT
}])


const modelValue = defineModel("value", {type: String, default: ""})

function glyphType(pack: IconfontJson, glyph: IconfontGlyph) {
  return pack.css_prefix_text + glyph.font_class
}

function onSearch(value: string) {
  state.value.search.text = value
  search()
}

function search() {
  const keyword = state.value.search.text.trim().toLowerCase()

  if (keyword === "") {
    state.value.search.dataSource = props.options
    return
  }

  state.value.search.dataSource = props.options
    .map(icon => ({
      ...icon,
      glyphs: icon.glyphs.filter(glyph =>
        glyphType(icon, glyph).toLowerCase().includes(keyword)
      ),
    }))
}

function glyphsOf(name: string) {
  const pack = state.value.search.dataSource.find(icon => icon.name === name)
  if (!pack) {
    return []
  }
  return pack.glyphs.map(glyph => ({
    key: glyph.icon_id,
    value: glyphType(pack, glyph),
  }))
}

const tabItems = computed(() =>
  state.value.search.dataSource.map(icon => ({
    key: `${icon.name}::${state.value.search.text}`,
    packName: icon.name,
    label: icon.name,
    icons: glyphsOf(icon.name),
  }))
)

function parseAvatarModel(raw: string) {

  const value = raw ?? ''
  const type = AVATAR_SCHEMES.find(scheme => value.startsWith(scheme))
  if (!type) {
    return {type: ICON_SELECT_AVATAR_MODE_VALUE.AVATAR, payload: value}
  }
  return {type, payload: value.slice(type.length)}
}

function toAvatarModel(type: IconSelectAvatarModeValueType, payload: string) {
  const text = payload ?? ''
  return text ? `${type}${text}` : ''
}
const avatarPayload = computed({
  get() {
    return parseAvatarModel(modelValue.value).payload
  },
  set(payload: string) {
    modelValue.value = toAvatarModel(state.value.avatarType, payload)
  },
})

watch(modelValue, (raw) => {
  if (props.mode !== ICON_SELECT_MODE.AVATAR) {
    return
  }
  state.value.avatarType = parseAvatarModel(raw ?? '').type
}, {immediate: true})

function onAvatarTypeChange(type: IconSelectAvatarModeValueType) {
  modelValue.value = toAvatarModel(type, parseAvatarModel(modelValue.value).payload)
}

watch(() => props.options, () => search(), {immediate: true})
</script>

<template>
  <template v-if="preview">
    <a-avatar v-if="state.avatarType === ICON_SELECT_AVATAR_MODE_VALUE.AVATAR  || props.mode === ICON_SELECT_MODE.AVATAR" :src="avatarPayload" />
    <a-avatar v-else-if="state.avatarType === ICON_SELECT_AVATAR_MODE_VALUE.ICON || props.mode === ICON_SELECT_MODE.VIEW">
      <icon-font :type="avatarPayload" />
    </a-avatar>
    <a-avatar v-else-if="state.avatarType === ICON_SELECT_AVATAR_MODE_VALUE.INPUT || props.mode === ICON_SELECT_MODE.INPUT">
      {{ avatarPayload.substring(0, 1) }}
    </a-avatar>
  </template>
  <template v-else>
    <a-tabs
      v-if="props.mode === ICON_SELECT_MODE.VIEW"
      :classes="{body:'overflow-auto max-h-80'}"
      centered
      :items="tabItems"
    >
      <template #labelRender="{item}">
        {{ item.label }} ({{ glyphsOf(item.packName).length }})
      </template>
      <template #contentRender="{item}">
        <a-space wrap>
          <a-button
            v-for="glyph in glyphsOf(item.packName)"
            :key="glyph.key"
            size="large"
            :type="modelValue === glyph.value ? 'primary' : 'default'"
            @click="modelValue = glyph.value"
          >
            <icon-font class="icon text-2xl" :type="glyph.value"/>
          </a-button>
        </a-space>
      </template>
      <template #leftExtra>
        <a-input-search @search="onSearch" @keydown.enter.prevent />
      </template>
      <template #rightExtra>
        <a-space-compact>
          <a-space-addon>
            {{ props.options.find(icon => icon.glyphs.some(s => glyphType(icon, s) === String(modelValue)))?.name }}
          </a-space-addon>
          <a-input v-model:value="modelValue"/>
        </a-space-compact>
      </template>
    </a-tabs>
    <a-space-compact v-else-if="props.mode === ICON_SELECT_MODE.INPUT">
      <a-input v-bind="$attrs" v-model:value="modelValue" />
    </a-space-compact>
    <a-flex align="center" gap="small" class="w-full" v-else-if="props.mode === ICON_SELECT_MODE.AVATAR">
      <a-avatar v-if="state.avatarType === ICON_SELECT_AVATAR_MODE_VALUE.AVATAR" :src="avatarPayload" />
      <a-avatar v-else-if="state.avatarType === ICON_SELECT_AVATAR_MODE_VALUE.ICON">
        <icon-font :type="avatarPayload" />
      </a-avatar>
      <a-avatar v-else-if="state.avatarType === ICON_SELECT_AVATAR_MODE_VALUE.INPUT">
        {{ avatarPayload.substring(0, 1) }}
      </a-avatar>
      <a-space-compact block class="flex-1">
        <a-select
          :options="avatarOptions"
          class="w-auto"
          v-model:value="state.avatarType"
          @change="onAvatarTypeChange"
        />
        <a-input class="w-full" v-model:value="avatarPayload"/>
        <a-popover v-if="state.avatarType === ICON_SELECT_AVATAR_MODE_VALUE.ICON">
          <template #title>
            <a-flex justify="space-between" align="center">
              <span>{{ globalProperties.$t("common.icon") }}</span>
              <a-input-search class="w-30" size="small" @search="onSearch" @keydown.enter.prevent />
            </a-flex>
          </template>
          <template #content>
            <a-tabs
              :classes="{body:'overflow-auto max-h-40 max-w-100'}"
              :items="tabItems"
              centered
            >
              <template #contentRender="{item}">
                <a-space wrap>
                  <a-button
                    v-for="glyph in glyphsOf(item.packName)"
                    :key="glyph.key"
                    size="large"
                    :type="avatarPayload === glyph.value ? 'primary' : 'default'"
                    @click="avatarPayload = glyph.value"
                  >
                    <icon-font class="icon text-2xl" :type="glyph.value"/>
                  </a-button>
                </a-space>
              </template>
            </a-tabs>
          </template>
          <a-button>
            <icon-font class="icon" :type="avatarPayload || 'loncra-lasso-select'"/>
          </a-button>
        </a-popover>
      </a-space-compact>
    </a-flex>
  </template>
</template>
