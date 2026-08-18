<script setup lang="ts">

import {type ComponentInternalInstance, computed, getCurrentInstance, ref} from "vue";
import type {
  CarouselEntity,
  CarouselSavePayload,
  EnumBucketsResponseBody,
  NameValueEnumMetadata,
  ObjectWriteResult,
  RestResult
} from "@/types/apis";
import {requireNonNullOrUndefined} from "@/utils";
import {
  CAROUSEL_TYPE,
  OPERATION_DATA_TRACE_TABLE,
  RESOURCE_SERVER_CAROUSEL_ROUTE,
  SYSTEM_ENUM_TYPE
} from "@/constants";
import {SYSTEM_MODULE_NAME} from "@/constants/systemConstant";
import {ResourceServerService} from "@/apis";
import {CarouselService} from "@/apis/resource-server/carouselService.ts";
import {disableDate, disableTime} from "@/utils/dateUtils";
import LBasicForm from "@/components/basic/form/BasicForm.vue";
import type {Dayjs} from "dayjs";
import LAttachmentUpload from "@/components/attachment/AttachmentUpload.vue";

defineOptions({
  name: 'ResourceServerCarouseForm',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new CarouselService()

const coverUploadRef = ref<{ upload: () => Promise<ObjectWriteResult | undefined> }>()

const options = ref<{
  entity:CarouselSavePayload
  typeOptions:NameValueEnumMetadata<number>[]
  spinning:boolean
}>({
  spinning: false,
  entity: {
    name: "",
    type: CAROUSEL_TYPE.PC,
    link: {
      id: "http://",
      value: ""
    },
    cover:null as unknown as ObjectWriteResult,
    remark: "",
    version: null as unknown as number,
    id: null as unknown as number,
    expirationTime: null as unknown as number,
    showtime: null as unknown as number,
  },
  typeOptions:[]
})

const linkOptions = computed<NameValueEnumMetadata<string>[]>(() => [
  {name: 'http://', value: 'http://'},
  {name: 'https://', value: 'https://'},
  {name: globalProperties.$t('common.applet'), value: 'applet://'}
])

async function preMounted() {
  const enums:RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({[SYSTEM_MODULE_NAME.RESOURCE_SERVER]:[{id:SYSTEM_ENUM_TYPE.CAROUSEL_TYPE_ENUM}]})

  if (enums.data) {
    options.value.typeOptions = enums.data[SYSTEM_MODULE_NAME.RESOURCE_SERVER]?.[SYSTEM_ENUM_TYPE.CAROUSEL_TYPE_ENUM] as NameValueEnumMetadata<number>[]
  }
  if (globalProperties.$route.query.type) {
    options.value.entity.type = Number(globalProperties.$route.query.type)
  }
}

function setPageTitle(title:string, entity: CarouselEntity | CarouselSavePayload) {
  if (entity.id) {
    return title + ' (' + entity.name + ')'
  }
  return title
}

function postGetEntity(_entity:CarouselEntity) {
  if (_entity.showtime) {
    _entity.showtime = globalProperties.$dayjs(_entity.showtime)
  }
  if (_entity.expirationTime) {
    _entity.expirationTime = globalProperties.$dayjs(_entity.expirationTime)
  }
  return _entity;
}

async function preSubmit() {
  await coverUploadRef.value?.upload()
}

</script>

<template>
  <div>
    <l-basic-form
      :operation-data-trace-target="OPERATION_DATA_TRACE_TABLE.CAROUSEL"
      :post-get-entity="postGetEntity"
      :pre-mounted="preMounted"
      :pre-submit="preSubmit"
      :title-text="setPageTitle"
      :redirect="{name:RESOURCE_SERVER_CAROUSEL_ROUTE.HOME}"
      :service="service"
      v-model:entity="options.entity"
      :spinning="options.spinning"
    >

      <template #rowLayout>
        <a-col :span="24">
          <a-form-item :label="globalProperties.$t('resourceServer.carousel.image')" name="cover" :rules="[{ required: true, trigger: 'change' }]">
            <l-attachment-upload ref="coverUploadRef" :max-count="1" :multiple="false" mode="dragger" v-model:value="options.entity.cover">

            </l-attachment-upload>
          </a-form-item>
        </a-col>
        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item :label="globalProperties.$t('common.name')" name="name" :rules="[{ required: true, trigger: 'change'}]">
            <a-input ref="name" v-model:value="options.entity.name"/>
          </a-form-item>
        </a-col>

        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item :label="globalProperties.$t('common.type')" name="type">
            <a-select class="w-full" v-model:value="options.entity.type" :options="options.typeOptions" :fieldNames="{label:'name'}">
            </a-select>
          </a-form-item>
        </a-col>

        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item :label="globalProperties.$t('resourceServer.carousel.showtime')" name="showtime">
            <a-date-picker show-time class="w-full" v-model:value="options.entity.showtime" />
          </a-form-item>
        </a-col>

        <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
          <a-form-item :label="globalProperties.$t('common.expiresTime')" name="expirationTime">
            <a-date-picker :disabled-date="(value:Dayjs) => disableDate(value, options.entity.showtime as Dayjs)" :disabled-time="(current:Dayjs | null) => disableTime(current, options.entity.showtime as Dayjs)" show-time class="w-full" v-model:value="options.entity.expirationTime as Dayjs" />
          </a-form-item>
        </a-col>
      </template>

      <a-form-item :label="globalProperties.$t('common.link')" :name="['link','value']" :rules="[{ required: true, trigger: 'change'}]">
        <a-space-compact block>
          <a-select v-model:value="options.entity.link.id" style="width: 120px" :options="linkOptions"/>
          <a-input v-model:value="options.entity.link.value" />
        </a-space-compact>
      </a-form-item>

      <a-form-item :label="globalProperties.$t('common.remark')" name="remark">
        <a-textarea v-model:value="options.entity.remark" :auto-size="{ minRows: 5, maxRows: 10 }"/>
      </a-form-item>

    </l-basic-form>
  </div>
</template>
