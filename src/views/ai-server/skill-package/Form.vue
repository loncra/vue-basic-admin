<script setup lang="ts">
import {nextTick, ref} from 'vue'
import type {
  DataDictionaryMetadata,
  EnumBucketsResponseBody,
  GitSkillSourceMetadata,
  ManualSkillSourceMetadata,
  NameValueEnumMetadata,
  RestResult,
  SkillPackageEntity,
  SkillPackageSavePayload,
  SkillSourceMetadata,
} from '@/types/apis'
import {getEnumValue, loadIcon} from '@/utils'
import LBasicForm from '@/components/basic/form/BasicForm.vue'
import {ResourceServerService} from '@/apis'
import {AiSkillPackageService} from '@/apis/ai-server/aiSkillPackageService.ts'
import {
  ATTACHMENT_UPLOAD_MODE,
  ICON_SELECT_MODE,
  OPERATION_DATA_TRACE_TABLE,
  SKILL_GROUP_CODE_PREFIX,
  SKILL_PACKAGE_ROUTE,
  SKILL_SOURCE_TYPE,
  SKILL_UPDATE_POLICY,
  SYSTEM_CONSTANT,
  SYSTEM_ENUM_TYPE,
  SYSTEM_MODULE_NAME,
  TIME_UNIT_TYPE,
} from '@/constants'
import LIconSelect from '@/components/basic/IconSelect.vue'
import type {IconfontJson} from '@/types/composables'
import LFileEditor from "@/components/attachment/FileEditor.vue";
import LAttachmentUpload from "@/components/attachment/AttachmentUpload.vue";
import type {AttachmentUploadExpose} from "@/types/composables/attachmentUpload.ts";

defineOptions({
  name: 'AiServerSkillPackageAddForm',
})

const service = new AiSkillPackageService()

function createEmptyEntity(): SkillPackageEntity {
  return {
    id: undefined as unknown as number,
    version: undefined as unknown as number,
    name: '',
    packageKey: '',
    summary: '',
    tags: [],
    category: undefined as unknown as DataDictionaryMetadata,
    additionalInformation: '',
    origin: undefined as unknown as number,
    status: undefined as unknown as number,
    type: undefined as unknown as number,
    icon: '',
    defaultUpdatePolicy: undefined as unknown as number,
    sourceType: undefined as unknown as number,
    metadata:{
      source:{type:SKILL_SOURCE_TYPE.MANUAL} as ManualSkillSourceMetadata
    }
  }
}

const options = ref<{
  entity: SkillPackageEntity
  spinning: boolean
  originOptions: NameValueEnumMetadata<number>[]
  typeOptions: NameValueEnumMetadata<number>[]
  updatePolicyOptions: NameValueEnumMetadata<number>[]
  sourceTypeOptions: NameValueEnumMetadata<number>[]
  timeOptions:NameValueEnumMetadata<string>[]
  groupOptions: DataDictionaryMetadata[]
  icons: string[]
  iconOptions: IconfontJson[]
}>({
  spinning: false,
  entity: createEmptyEntity(),
  originOptions: [],
  typeOptions: [],
  timeOptions:[],
  updatePolicyOptions: [],
  sourceTypeOptions: [],
  icons: ['/font_ai_icon/iconfont.json'],
  iconOptions: [],
  groupOptions: []
})

const attachmentUpload = ref<AttachmentUploadExpose>()

async function preMounted() {
  options.value.spinning = true
  const enums: RestResult<EnumBucketsResponseBody> =
    await ResourceServerService.getServiceEnumerates({
      [SYSTEM_MODULE_NAME.RESOURCE_SERVER]: [
        {id: SYSTEM_ENUM_TYPE.UPDATE_POLICY_ENUM},
        {id: SYSTEM_ENUM_TYPE.TIME_UNIT_ENUM},
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
    options.value.timeOptions = (resourceServer[SYSTEM_ENUM_TYPE.TIME_UNIT_ENUM] || []) as NameValueEnumMetadata<string>[]
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

async function postSubmit(result:RestResult<number>) {
  options.value.entity.id = result.data
  await nextTick()
  if (getEnumValue(options.value.entity.sourceType) === SKILL_SOURCE_TYPE.MANUAL) {
    try {
      options.value.spinning = true
      await attachmentUpload?.value?.upload()
    } finally {
      options.value.spinning = false
    }
  }
  return false
}

function onDefaultUpdatePolicyChange(value:number) {
  if (value !== SKILL_UPDATE_POLICY.AUTOMATIC) {
    return
  }
  if (!options.value.entity.metadata.updatePolicyTime) {
    options.value.entity.metadata.updatePolicyTime = {value:1, unit:TIME_UNIT_TYPE.DAYS}
  }
}

function onSourceTypeChange(value:number) {
  options.value.entity.metadata = {
    source: {type:value} as SkillSourceMetadata
  }
  if (value === SKILL_SOURCE_TYPE.MANUAL) {
    options.value.entity.defaultUpdatePolicy = SKILL_UPDATE_POLICY.MANUAL
    options.value.entity.metadata.source = {type:SKILL_SOURCE_TYPE.MANUAL} as ManualSkillSourceMetadata
  } else {
    options.value.entity.metadata.source = {type:SKILL_SOURCE_TYPE.GIT, url:''} as GitSkillSourceMetadata
  }
}

</script>

<template>
  <div>
    <l-basic-form
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.AI_SKILL_PACKAGE"
      :pre-mounted="preMounted"
      :title-text="setPageTitle"
      :redirect="{name: SKILL_PACKAGE_ROUTE.HOME}"
      :service="service"
      :post-submit="postSubmit"
      v-model:entity="options.entity"
      :spinning="options.spinning"
    >
      <template #rowLayout>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="name"
            :label="$t('common.name')"
            :rules="[{required: true}]"
          >
            <a-input v-model:value="options.entity.name" />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="packageKey"
            :label="$t('aiServer.skillPackage.packageKey')"
            :rules="[{required: true}]"
          >
            <a-input
              v-model:value="options.entity.packageKey"
              :disabled="$route.query[SYSTEM_CONSTANT.ID_NAME] !== undefined"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="icon"
            :label="$t('common.icon')"
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
            name="category"
            :label="$t('common.group')"
            :rules="[{required: true}]"
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
            :label="$t('aiServer.skillPackage.origin')"
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
            :label="$t('common.type')"
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
            :label="$t('aiServer.skillPackage.defaultUpdatePolicy')"
            :rules="[{required: true}]"
          >
            <a-space-compact block>
              <a-select
                class="w-full"
                :disabled="getEnumValue(options.entity.sourceType) === SKILL_SOURCE_TYPE.MANUAL"
                v-model:value="options.entity.defaultUpdatePolicy"
                :options="options.updatePolicyOptions"
                @change="onDefaultUpdatePolicyChange"
                :field-names="{label: 'name'}"
              />
              <template v-if="options.entity.metadata.updatePolicyTime && getEnumValue(options.entity.defaultUpdatePolicy) === SKILL_UPDATE_POLICY.AUTOMATIC">
                <a-space-addon>
                  {{$t('aiServer.skillPackage.automaticUpdateInterval')}}
                </a-space-addon>
                <a-input-number class="w-60" v-model:value="options.entity.metadata.updatePolicyTime.value" :min="1" />
                <a-select
                  :options="options.timeOptions"
                  class="w-auto"
                  :field-names="{label: 'name'}"
                  v-model:value="options.entity.metadata.updatePolicyTime.unit"
                />
              </template>
            </a-space-compact>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item
            name="sourceType"
            :label="$t('aiServer.skillPackage.sourceType')"
            :rules="[{required: true}]"
          >
            <a-select
              class="w-full"
              v-model:value="options.entity.sourceType"
              :options="options.sourceTypeOptions"
              :field-names="{label: 'name'}"
              @change="onSourceTypeChange"
            />
          </a-form-item>
        </a-col>
      </template>
      <a-form-item
        v-if="getEnumValue(options.entity.sourceType) === SKILL_SOURCE_TYPE.GIT"
        :name="['metadata', 'source', 'url']"
        :label="$t('aiServer.skillPackage.git.url')"
        :rules="[{required: true}]"
      >
        <a-space-compact block>
          <a-input v-model:value="(options.entity.metadata.source as GitSkillSourceMetadata).url" />
          <a-space-addon>
            <a-space>
              <a-tooltip :title="$t('aiServer.skillPackage.git.path.subTitle')">
                <icon-font type="loncra-circle-question-mark"></icon-font>
              </a-tooltip>
              <span>{{$t('aiServer.skillPackage.git.path.title')}}</span>
            </a-space>
          </a-space-addon>
          <a-input class="w-70" v-model:value="(options.entity.metadata.source as GitSkillSourceMetadata).path" />
          <a-space-addon>
            <a-space>
              <a-tooltip :title="$t('aiServer.skillPackage.git.ref.subTitle')">
                <icon-font type="loncra-circle-question-mark"></icon-font>
              </a-tooltip>
              <span>{{$t('aiServer.skillPackage.git.ref.title')}}</span>
            </a-space>
          </a-space-addon>
          <a-input class="w-50" v-model:value="(options.entity.metadata.source as GitSkillSourceMetadata).ref" />
          <a-space-addon>
            <a-space>
              <a-tooltip :title="$t('aiServer.skillPackage.git.sha.subTitle')">
                <icon-font type="loncra-circle-question-mark"></icon-font>
              </a-tooltip>
              <span>{{$t('aiServer.skillPackage.git.sha.title')}}</span>
            </a-space>
          </a-space-addon>
          <a-input class="w-70" v-model:value="(options.entity.metadata.source as GitSkillSourceMetadata).sha" />
        </a-space-compact>
      </a-form-item>
      <a-form-item
        name="tags"
        :label="$t('aiServer.skillPackage.tags')"
      >
        <a-select
          class="w-full"
          mode="tags"
          max-tag-count="responsive"
          v-model:value="options.entity.tags"
        />
      </a-form-item>
      <a-form-item
        v-if="options.entity.id !== undefined || getEnumValue(options.entity.sourceType) === SKILL_SOURCE_TYPE.MANUAL"
        name="files"
        :label="$t('aiServer.skillPackage.files')"
      >
        <a-flex gap="middle" vertical>
          <l-attachment-upload v-if="options.entity.id === undefined" directory ref="attachmentUpload" :upload-options="{param:{prefix:'ai/skill/' + options.entity.id, randomName:false}}" bucket="system.file" :mode="ATTACHMENT_UPLOAD_MODE.DRAGGER" />
          <l-file-editor v-else bucket="system.file" :path="'ai/skill/' + options.entity.id + '/'" :name="options.entity.packageKey"/>
        </a-flex>
      </a-form-item>
      <a-form-item
        name="summary"
        :label="$t('aiServer.skillPackage.summary')"
      >
        <a-textarea
          v-model:value="options.entity.summary"
          :rows="4"
          show-count
          :maxlength="512"
        />
      </a-form-item>
      <a-form-item
        name="additionalInformation"
        :label="$t('aiServer.skillPackage.additionalInformation')"
      >
        <a-textarea
          v-model:value="options.entity.additionalInformation"
          :rows="4"
          show-count
          :maxlength="512"
        />
      </a-form-item>

    </l-basic-form>
  </div>
</template>
