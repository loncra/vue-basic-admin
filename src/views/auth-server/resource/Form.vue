<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import type {
  IconfontJson,
  NameValueEnumMetadata,
  ResourceEntity,
  ResourceSavePayload,
  RestResult
} from "@/types";
import {requireNonNullOrUndefined} from "@/utils";
import LBasicForm from "@/components/basic/BasicForm.vue";
import {ResourceServerService, ResourceService} from "@/apis";
import type {EnumBucketsResponseBody} from "@/types/resource-server/resourceType.ts";
import {loadIcon} from "@/utils/resourceUtils";
import {getEnumValue} from "@/utils/commonUtils";

defineOptions({
  name: 'LAuthServerConsoleUserForm',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new ResourceService()
const resourceServerService = new ResourceServerService()

const options = ref<{
  entity:ResourceSavePayload
  enabledOptions:NameValueEnumMetadata<number>[]
  typeOptions:NameValueEnumMetadata<string>[]
  sourceOptions:NameValueEnumMetadata<string>[]
  parent?:ResourceEntity
  icons:string[]
  iconOptions: IconfontJson[]
  spinning:boolean
}>({
  spinning: false,
  entity: {
    sort: 0,
    enabled:1,
    authority: "",
    type: "",
    sources: [],
    name: "",
    icon: "",
    parentId: null as unknown as number,
    applicationName: "",
    page: "",
    id: null as unknown as number,
    version: null as unknown as string,
    category: 20
  },
  typeOptions:[],
  enabledOptions:[],
  sourceOptions:[],
  icons:["/font_system_icon/iconfont.json","/font_xiaojiage/iconfont.json"],
  iconOptions:[],
})

async function mounted() {

  const enums:RestResult<EnumBucketsResponseBody> = await resourceServerService.getServiceEnumerates({"resource-server":[{"id":"ResourceSourceEnum"},{"id":"YesOrNo"}],"auth-server":[{"id":"ResourceTypeEnum"}]})
  if (enums.data) {
    options.value.enabledOptions = enums.data['resource-server']?.YesOrNo as NameValueEnumMetadata<number>[]
    options.value.sourceOptions = enums.data['resource-server']?.ResourceSourceEnum as NameValueEnumMetadata<string>[]
    options.value.typeOptions = enums.data['auth-server']?.ResourceTypeEnum as NameValueEnumMetadata<string>[]
  }
  if (globalProperties.$route.query.parentId) {
    const result:RestResult<ResourceEntity> = await service.get(globalProperties.$route.query.parentId as unknown as number)
    if (result.data) {
      options.value.parent = result.data
      options.value.entity.parentId = options.value.parent.id
    }
  }

  for (const icon of options.value.icons) {
    const iconData:IconfontJson = await loadIcon(import.meta.env.VITE_APP_SITE_URL + icon)
    options.value.iconOptions.push(iconData)
  }
  console.log(options.value.iconOptions)
}

function setPageTitle(title:string, entity: ResourceEntity) {
  if (options.value.parent) {
    return title + ' (' + options.value.parent.name + ')'
  } else if (entity.id) {
    return title + ' (' + entity.name + ')'
  }
  return title
}

</script>

<template>
  <div>
    <l-basic-form
      :pre-mounted="mounted"
      :title-text="setPageTitle"
      :redirect="{name:'auth_server_resource'}"
      :service="service"
      v-model:entity="options.entity"
      :spinning="options.spinning"
    >
      <template #rowLayout>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="name" :label="globalProperties.$t('common.name')" :rules="getEnumValue(options.entity.category) === 10 ? undefined : [{required: true}]">
            <a-input v-model:value="options.entity.name" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="authority" :label="globalProperties.$t('authServer.authority')" :rules="getEnumValue(options.entity.category) === 10 ? undefined : [{required: true}]">
            <a-input v-model:value="options.entity.authority" :disabled="options.entity.id && getEnumValue(options.entity.category) === 10" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="sources" :label="globalProperties.$t('authServer.source')" :rules="getEnumValue(options.entity.category) === 10 ? undefined : [{required: true, trigger: 'change', type: 'array'}]">
            <a-select mode="multiple" :disabled="options.entity.id && getEnumValue(options.entity.category) === 10" v-model:value="options.entity.sources" :options="options.sourceOptions" :field-names="{label:'name'}" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="type" :label="globalProperties.$t('common.type')">
            <a-select :disabled="options.entity.id && getEnumValue(options.entity.category) === 10" v-model:value="options.entity.type" :options="options.typeOptions" :field-names="{label:'name'}" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="enabled" :label="globalProperties.$t('common.enabled')">
            <a-select :disabled="options.entity.id && getEnumValue(options.entity.category) === 10" v-model:value="options.entity.enabled" :options="options.enabledOptions" :field-names="{label:'name'}" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item name="page" :label="globalProperties.$t('authServer.resource.page')" >
            <a-input v-model:value="options.entity.page" />
          </a-form-item>
        </a-col>

      </template>

      <a-form-item name="icon" :label="globalProperties.$t('authServer.resource.icon')">
        <a-tabs :items="options.iconOptions.map(icon => ({key: icon.name, label: icon.name, icons: icon.glyphs.map(glyph => ({key: glyph.icon_id, value: icon.css_prefix_text + glyph.font_class}))}))">
          <template #contentRender="{item}">
            <a-space wrap>
              <a-button @click="() => options.entity.icon = glyph.value" :type="options.entity.icon === glyph.value ? 'primary' : 'default'"  v-for="glyph in item.icons" :key="glyph.key">
                <icon-font class="icon" :type="glyph.value"/>
              </a-button>
            </a-space>
          </template>
        </a-tabs>
      </a-form-item>
      <a-form-item name="remark" :label="globalProperties.$t('common.remark')">
        <a-textarea v-model:value="options.entity.remark" :rows="4" show-count :maxlength="256" />
      </a-form-item>
    </l-basic-form>
  </div>
</template>
