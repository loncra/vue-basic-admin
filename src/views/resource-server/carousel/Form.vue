<script setup lang="ts">

import {type ComponentInternalInstance, getCurrentInstance, ref} from "vue";
import type {
  CarouselEntity,
  CarouselSavePayload,
  EnumBucketsResponseBody,
  NameValueEnumMetadata,
  RestResult
} from "@/types/apis";
import {requireNonNullOrUndefined} from "@/utils";
import {ResourceServerService} from "@/apis";
import {CarouselService} from "@/apis/resource-server/carouselService.ts";
import {AttachmentService} from "@/apis/resource-server/attachmentService.ts";
import {disableDate, disableTime} from "@/utils/dateUtils";
import LBasicForm from "@/components/basic/BasicForm.vue";
import type {Dayjs} from "dayjs";
import LAttachmentUpload from "@/components/attachment/AttachmentUpload.vue";

defineOptions({
  name: 'ResourceServerCarouseForm',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const service = new CarouselService()
const resourceServerService = new ResourceServerService()
const attachmentService = new AttachmentService()

const options = ref<{
  entity:CarouselSavePayload
  linkOptions:NameValueEnumMetadata<string>[]
  typeOptions:NameValueEnumMetadata<number>[]
  spinning:boolean
}>({
  spinning: false,
  entity: {
    name: "",
    type: 10,
    link: {
      id: "http://",
      value: ""
    },
    remark: "",
    version: null as unknown as number,
    id: null as unknown as number,
    expirationTime: null as unknown as number,
    showtime: null as unknown as number,
    cover: [],
  },
  linkOptions:[
    {name: 'http://', value: 'http://'},
    {name: 'https://', value: 'https://'},
    {name: '小程序页面', value: 'applet://'}
  ],
  typeOptions:[]
})

async function preMounted() {
  const enums:RestResult<EnumBucketsResponseBody> = await resourceServerService.getServiceEnumerates({"resource-server":[{"id":"CarouselTypeEnum"}]})

  if (enums.data) {
    options.value.typeOptions = enums.data['resource-server']?.CarouselTypeEnum as NameValueEnumMetadata<number>[]
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
  /*if (_entity.cover) {
    coverFileList.value = initFileListFromObjectWriteResults(_entity.cover, attachmentService)
  } else {
    coverFileList.value = []
  }*/
  return _entity;
}

async function preSubmit() {
  /*await coverUploadRef.value?.upload()
  const uploaded = coverFileList.value.find((file) => file.objectWriteResult || file.bucketName)
  if (uploaded?.objectWriteResult) {
    options.value.entity.cover = uploaded.objectWriteResult
  } else if (uploaded?.bucketName && uploaded.objectName && uploaded.etag) {
    options.value.entity.cover = {
      bucketName: uploaded.bucketName,
      objectName: uploaded.objectName,
      etag: uploaded.etag,
      extraHeaders: uploaded.extraHeaders,
    }
  } else if (coverFileList.value.length === 0) {
    options.value.entity.cover = undefined
  }*/
}

</script>

<template>
  <div>
    <l-basic-form
      operation-data-trace-target="tb_carousel"
      :post-get-entity="postGetEntity"
      :pre-mounted="preMounted"
      :pre-submit="preSubmit"
      :title-text="setPageTitle"
      :redirect="{name:'resource_server_carousel'}"
      :service="service"
      v-model:entity="options.entity"
      :spinning="options.spinning"
    >

      <template #rowLayout>
        <a-col :span="24">
          <a-form-item :label="globalProperties.$t('resourceServer.carousel.image')" name="cover" :rules="[{ required: true, type: 'array', min: 3, trigger: 'change' }]">
            <l-attachment-upload :max-count="3" mode="picture-card" v-model:value="options.entity.cover" />
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

      <a-form-item label="链接地址" :name="['link','value']" :rules="[{ required: true, trigger: 'change'}]">
        <a-space-compact block>
          <a-select v-model:value="options.entity.link.id" style="width: 120px" :options="options.linkOptions"/>
          <a-input v-model:value="options.entity.link.value" />
        </a-space-compact>
      </a-form-item>

      <a-form-item :label="globalProperties.$t('common.remark')" name="remark">
        <a-textarea v-model:value="options.entity.remark" :auto-size="{ minRows: 5, maxRows: 10 }"/>
      </a-form-item>

    </l-basic-form>
  </div>
</template>

