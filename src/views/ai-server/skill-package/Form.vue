<script setup lang="ts">
import {type ComponentInternalInstance, getCurrentInstance, ref} from 'vue'
import type {
  DataDictionaryMetadata,
  EnumBucketsResponseBody,
  NameValueEnumMetadata,
  RestResult,
  SkillPackageEntity,
  SkillPackageSavePayload,
} from '@/types/apis'
import {loadIcon, requireNonNullOrUndefined} from '@/utils'
import LBasicForm from '@/components/basic/form/BasicForm.vue'
import {ResourceServerService} from '@/apis'
import {AiSkillPackageService} from '@/apis/ai-server/aiSkillPackageService.ts'
import {
  FOLDER_ADD_TYPE,
  ICON_SELECT_MODE,
  OPERATION_DATA_TRACE_TABLE,
  SKILL_GROUP_CODE_PREFIX,
  SKILL_PACKAGE_ROUTE,
  SYSTEM_CONSTANT,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
} from '@/constants'
import LIconSelect from '@/components/basic/IconSelect.vue'
import type {FileItem, IconfontJson} from '@/types/composables'
import LFileEditor from "@/components/attachment/FileEditor.vue";

defineOptions({
  name: 'AiServerSkillPackageForm',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new AiSkillPackageService()
const saveEntity = service.save.bind(service)
service.save = (entity: SkillPackageSavePayload) => {
  const payload: SkillPackageEntity = {...entity}
  delete payload.files
  return saveEntity(payload)
}

function createDefaultFiles(): FileItem[] {
  return [
    {
      label: 'SKILL.md',
      key: 'SKILL.md',
      type: FOLDER_ADD_TYPE.FILE,
      readonly: true,
      content: '---\nname: skill-name\ndescription: Use when ...\n---\n\n# Skill\n\n',
    }, {
      key: String(crypto.randomUUID()),
      label: '1',
      type: FOLDER_ADD_TYPE.FOLDER,
      children: [{
        key: String(crypto.randomUUID()),
        label: '2',
        type: FOLDER_ADD_TYPE.FOLDER,
      }]
    }
  ]
}

function createEmptyEntity(): SkillPackageEntity {
  return {
    id: undefined as unknown as number,
    version: undefined as unknown as number,
    name: '',
    packageKey: '',
    summary: '',
    tags: [],
    additionalInformation: '',
    origin: undefined as unknown as number,
    status: undefined as unknown as number,
    type: undefined as unknown as number,
    icon: '',
    defaultUpdatePolicy: undefined as unknown as number,
    sourceType: undefined as unknown as number,
    metadata: {},
    files: createDefaultFiles()
  }
}

const options = ref<{
  entity: SkillPackageEntity
  spinning: boolean
  originOptions: NameValueEnumMetadata<number>[]
  typeOptions: NameValueEnumMetadata<number>[]
  updatePolicyOptions: NameValueEnumMetadata<number>[]
  sourceTypeOptions: NameValueEnumMetadata<number>[]
  groupOptions: DataDictionaryMetadata[]
  icons: string[]
  iconOptions: IconfontJson[]
}>({
  spinning: false,
  entity: createEmptyEntity(),
  originOptions: [],
  typeOptions: [],
  updatePolicyOptions: [],
  sourceTypeOptions: [],
  icons: ['/font_ai_icon/iconfont.json'],
  iconOptions: [],
  groupOptions: [],
})

function postGetEntity(entity: SkillPackageEntity) {
  if (!entity.files?.length) {
    entity.files = createDefaultFiles()
  }
  /*if (!entity.assetFiles) {
    entity.assetFiles = []
  }*/
  if (!entity.metadata) {
    entity.metadata = {}
  }
  return entity
}

async function preMounted() {
  options.value.spinning = true
  const enums: RestResult<EnumBucketsResponseBody> =
    await ResourceServerService.getServiceEnumerates({
      [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: [
        {id: SYSTEM_ENUM_TYPE.UPDATE_POLICY_ENUM},
      ],
      [SYSTEM_MODULE_NAME.AI_SERVER]: [
        {id: SYSTEM_ENUM_TYPE.PACKAGE_ORIGIN_ENUM},
        {id: SYSTEM_ENUM_TYPE.MCP_PACKAGE_TYPE_ENUM},
        {id: SYSTEM_ENUM_TYPE.SKILL_SOURCE_TYPE_ENUM},
      ],
    })
  if (enums.data) {
    const resourceServer = enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER] ?? {}
    const aiServer = enums.data[SYSTEM_MODULE_NAME.AI_SERVER] ?? {}
    options.value.originOptions = (aiServer[SYSTEM_ENUM_TYPE.PACKAGE_ORIGIN_ENUM] || []) as NameValueEnumMetadata<number>[]
    options.value.typeOptions = (aiServer[SYSTEM_ENUM_TYPE.MCP_PACKAGE_TYPE_ENUM] || []) as NameValueEnumMetadata<number>[]
    options.value.updatePolicyOptions = (resourceServer[SYSTEM_ENUM_TYPE.UPDATE_POLICY_ENUM] || []) as NameValueEnumMetadata<number>[]
    options.value.sourceTypeOptions = (aiServer[SYSTEM_ENUM_TYPE.SKILL_SOURCE_TYPE_ENUM] || []) as NameValueEnumMetadata<number>[]
  }
  const result: RestResult<Record<string, DataDictionaryMetadata[]>> =
    await ResourceServerService.findDataDictionariesByCodes([SKILL_GROUP_CODE_PREFIX])
  if (result.data) {
    options.value.groupOptions = result.data[SKILL_GROUP_CODE_PREFIX] ?? []
  }
  for (const icon of options.value.icons) {
    const iconData: IconfontJson = await loadIcon(import.meta.env.VITE_APP_SITE_URL + icon)
    options.value.iconOptions.push(iconData)
  }
  options.value.spinning = false
}

function setPageTitle(title: string, entity: SkillPackageEntity | SkillPackageSavePayload) {
  if (entity.id) {
    return title + ' (' + entity.name + ')'
  }
  return title
}
</script>

<template>
  <div>
    <l-basic-form
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.AI_SKILL_PACKAGE"
      :pre-mounted="preMounted"
      :post-get-entity="postGetEntity"
      :title-text="setPageTitle"
      :redirect="{name: SKILL_PACKAGE_ROUTE.HOME}"
      :service="service"
      v-model:entity="options.entity"
      :spinning="options.spinning"
    >
      <template #rowLayout>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="name"
            :label="globalProperties.$t('common.name')"
            :rules="[{required: true}]"
          >
            <a-input v-model:value="options.entity.name" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="packageKey"
            :label="globalProperties.$t('aiServer.skillPackage.packageKey')"
            :rules="[{required: true}]"
          >
            <a-input
              v-model:value="options.entity.packageKey"
              :disabled="globalProperties.$route.query[SYSTEM_CONSTANT.ID_NAME] !== undefined"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="icon"
            :label="globalProperties.$t('common.icon')"
          >
            <l-icon-select
              class="w-full"
              :mode="ICON_SELECT_MODE.AVATAR"
              v-model:value="options.entity.icon"
              :options="options.iconOptions"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="group"
            :label="globalProperties.$t('common.group')"
          >
            <a-select
              class="w-full"
              :value="options.entity.category?.code"
              :options="options.groupOptions"
              :field-names="{label: 'name', value: 'code'}"
              allow-clear
              @change="(_value: string, option: DataDictionaryMetadata) => options.entity.category = option"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="origin"
            :label="globalProperties.$t('aiServer.skillPackage.origin')"
            :rules="[{required: true}]"
          >
            <a-select
              class="w-full"
              v-model:value="options.entity.origin"
              :options="options.originOptions"
              :field-names="{label: 'name'}"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="type"
            :label="globalProperties.$t('common.type')"
            :rules="[{required: true}]"
          >
            <a-select
              class="w-full"
              v-model:value="options.entity.type"
              :options="options.typeOptions"
              :field-names="{label: 'name'}"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="defaultUpdatePolicy"
            :label="globalProperties.$t('aiServer.skillPackage.defaultUpdatePolicy')"
            :rules="[{required: true}]"
          >
            <a-select
              class="w-full"
              v-model:value="options.entity.defaultUpdatePolicy"
              :options="options.updatePolicyOptions"
              :field-names="{label: 'name'}"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="sourceType"
            :label="globalProperties.$t('aiServer.skillPackage.sourceType')"
          >
            <a-select
              class="w-full"
              v-model:value="options.entity.sourceType"
              :options="options.sourceTypeOptions"
              :field-names="{label: 'name'}"
              allow-clear
            />
          </a-form-item>
        </a-col>
        <a-col :span="24">
          <a-form-item
            name="tags"
            :label="globalProperties.$t('aiServer.skillPackage.tags')"
          >
            <a-select
              class="w-full"
              mode="tags"
              max-tag-count="responsive"
              v-model:value="options.entity.tags"
            />
          </a-form-item>
        </a-col>
        <a-col :span="24">
          <a-form-item
            name="files"
            :label="globalProperties.$t('aiServer.skillPackage.files')"
            :rules="[{required: true}]"
          >
            <l-file-editor v-model:items="options.entity.files" :name="options.entity.packageKey" />
          </a-form-item>
        </a-col>
        <a-col :span="24">
          <a-form-item
            name="summary"
            :label="globalProperties.$t('aiServer.skillPackage.summary')"
          >
            <a-textarea
              v-model:value="options.entity.summary"
              :rows="4"
              show-count
              :maxlength="512"
            />
          </a-form-item>
        </a-col>
        <a-col :span="24">
          <a-form-item
            name="additionalInformation"
            :label="globalProperties.$t('aiServer.skillPackage.additionalInformation')"
          >
            <a-textarea
              v-model:value="options.entity.additionalInformation"
              :rows="4"
              show-count
              :maxlength="512"
            />
          </a-form-item>
        </a-col>
      </template>
    </l-basic-form>
  </div>
</template>
