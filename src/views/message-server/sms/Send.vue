<script setup lang="ts">
import LForm from "@/components/Form.vue";
import LMenuTitleCard from "@/components/basic/MenuTitleCard.vue";
import {type ComponentInternalInstance, getCurrentInstance, onMounted, ref} from "vue";
import type {
  BatchResponse,
  EnumBucketsResponseBody,
  IdNameValueMetadata,
  NameValueEnumMetadata,
  RestResult,
  SmsMessageSendPayload,
  SmsSignEntity,
  SmsTemplateEntity
} from "@/types/apis";
import {SmsSignService} from "@/apis/message-server/sms/signService.ts";
import {SmsTemplateService} from "@/apis/message-server/sms/templateService.ts";
import {AuthServerService, ResourceServerService} from "@/apis";
import {useConfigProviderStore} from "@/stores/configProviderStore.ts";
import type {SearchableColumnType} from "@/types/composables";
import LUserSelect from "@/components/basic/UserSelect.vue";
import {getEnumName, getEnumValue, requireNonNullOrUndefined} from "@/utils";
import {SmsMessageService} from "@/apis/message-server";
import useApp from "antdv-next/dist/app/useApp";

defineOptions({
  name: 'MessageServerSmsForm',
})

const globalProperties =
  requireNonNullOrUndefined<ComponentInternalInstance>(getCurrentInstance()).appContext.config
    .globalProperties

const configProviderStore = useConfigProviderStore()

const {message} = useApp()

const options = ref<{
  loading:boolean
  spinning: boolean
  channelOptions:NameValueEnumMetadata<string>[]
  templateOptions:SmsTemplateEntity[]
  signOptions:SmsSignEntity[]
  form:SmsMessageSendPayload
}>({
  signOptions: [],
  loading:false,
  spinning:false,
  channelOptions: [],
  templateOptions:[],
  form: {
    phoneNumbers: [],
    channel: "alibabaCloud",
    content: '',
    type: 10,
    remark: '',
    metadata: {
      signCode: '',
      templateCode: '',
      variables: []
    }
  }
});

const variableTableColumns = ref<SearchableColumnType[]>([
  {
    title: globalProperties.$t('common.name'),
    dataIndex: "id",
    key:'id'
  },{
    title: globalProperties.$t('common.type'),
    dataIndex: "name",
    key:'name'
  },{
    title:  globalProperties.$t('common.value'),
    dataIndex: "value",
    key:'value'
  }
])

const currentTemplateContent = ref<String>('')
const formRef = ref();
const service = new SmsMessageService();

async function onTemplateCodeChange(value:string) {
  try {
    options.value.spinning = true;
    options.value.form.metadata.variables = [];
    options.value.form.content = '';
    const result:RestResult<Record<string, unknown>> = await new SmsTemplateService(getEnumValue(options.value.form.channel)).getByCode(value)

    const data = JSON.parse(String(result.data?.variableAttribute || ''));
    if (!data) {
      return ;
    }
    options.value.form.content = String(result.data?.templateContent || '');
    currentTemplateContent.value = String(result.data?.templateContent || '');
    for (const key in data) {
      const json:IdNameValueMetadata<string> = {id:key,name:data[key],value:''};
      options.value.form.metadata.variables.push(json);
    }
  } finally {
    options.value.spinning = false;
  }
}

async function mounted() {
  const enums:RestResult<EnumBucketsResponseBody> = await ResourceServerService.getServiceEnumerates({"resource-server":[{"id":"CloudChannelEnum"}]})
  if (enums.data) {
    options.value.channelOptions = enums.data['resource-server']?.CloudChannelEnum as NameValueEnumMetadata<string>[]
  }

  const templates:RestResult<SmsTemplateEntity[]> = await new SmsTemplateService(getEnumValue(options.value.form.channel)).find()
  if (templates.data) {
    options.value.templateOptions = templates.data
  }

  const signs:RestResult<SmsSignEntity[]> = await new SmsSignService(getEnumValue(options.value.form.channel)).find()
  if (signs.data) {
    options.value.signOptions = signs.data
  }
}

function variableValueChange(record:IdNameValueMetadata<string>) {
  options.value.form.content = currentTemplateContent.value.replace('${' + record.id + '}', record.value)
}

function onFinish(){
  formRef.value.validate().then(() => doSubmit())
}

async function doSubmit(){
  options.value.loading = true;
  try {
    const result = await service.send(options.value.form);
    const data = result.data
    if (Array.isArray(data)) {
      globalProperties.$router.push({name:'message_server_sms'})
    } else if (typeof (data as BatchResponse)) {
      const response = data as BatchResponse;
      globalProperties.$router.push({name:'message_server_batch_detail', query:{id:response.batchId}})
    }
    message.success(result.message)
  } catch (error) {
    message.error(error instanceof Error ? error.message : String(error))
  } finally {
    options.value.loading = false;
  }
}

onMounted(mounted);
</script>

<template>
  <div>
    <l-menu-title-card>
      <l-form ref="formRef" @finish="onFinish" :model="options.form">
        <a-row :gutter="configProviderStore.getToken().sizeMD">
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item :label="globalProperties.$t('common.channel')" name="channel" :rules="[{required: true, trigger: 'change'}]">
              <a-select v-model:value="options.form.channel" :options="options.channelOptions" :field-names="{label:'name'}">
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item :label="globalProperties.$t('messageServer.sms.template.code')" :name="['metadata','templateCode']" :rules="[{required: true, trigger: 'change'}]">
              <a-select :options="options.templateOptions" :field-names="{label:'name', value:'id'}" v-model:value="options.form.metadata.templateCode" @change="onTemplateCodeChange">

              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item :label="globalProperties.$t('messageServer.sms.sign.code')" :name="['metadata','signCode']" :rules="[{required: true, trigger: 'change'}]">
              <a-select :options="options.signOptions" :field-names="{label:'name', value:'id'}" v-model:value="options.form.metadata.signCode">

              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12" :xxl="12">
            <a-form-item :label="globalProperties.$t('common.phoneNumber')" name="phoneNumbers" :rules="[{required: true, trigger: 'change'}]">
              <l-user-select :query="{'filter_[phone_number_nen]':'true'}" v-model:value="options.form.phoneNumbers" mode="tags">
                <template #optionRender="{ option }">
                  <template v-if="option.data.payload">
                    <a-tooltip :title="globalProperties.$t('common.verified',{name:':' + getEnumName(option.data?.payload.phoneNumberVerified)})">
                      <a-typography-text :type="getEnumValue(option.data?.payload.phoneNumberVerified) === 1 ? 'success' : 'warning'">
                        {{ AuthServerService.getPrincipalNameByUserDetails(option.data?.payload) }}
                        ({{ option.data?.payload?.phoneNumber }})
                      </a-typography-text>
                    </a-tooltip>
                  </template>
                  <template v-else>
                    {{option.data.label}}
                  </template>
                </template>
              </l-user-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item :label="globalProperties.$t('common.remark')" name="remark">
          <a-textarea v-model:value="options.form.remark" :auto-size="{ minRows: 5, maxRows: 10 }"/>
        </a-form-item>
        <a-spin :spinning="options.spinning" v-if="options.form.content">
          <a-form-item :label="globalProperties.$t('common.content')" name="content">
            <a-textarea :value="(options.form.metadata.signCode !== '' ? '【' + options.form.metadata.signCode + '】' : '') + options.form.content" disabled :auto-size="{ minRows: 8, maxRows: 10 }"/>
          </a-form-item>
          <a-table v-if="options.form.metadata.variables.length > 0"
                   :pagination="false"
                   bordered
                   :data-source="options.form.metadata.variables"
                   :columns="variableTableColumns">
            <template #title>
              {{ globalProperties.$t('messageServer.sms.variable.title') }}
            </template>
            <template #bodyCell="{index, column, record}">
              <template v-if="column.dataIndex === 'value'">
                <a-form-item
                  class="m-0"
                  :message-variables="{ label: record.id }"
                  :name="['metadata','variables', index, 'value']"
                  :rules="[{required: true,  trigger: 'change'}]"
                >
                  <a-input v-model:value="record.value" @change="variableValueChange(record)"/>
                </a-form-item>
              </template>
            </template>
          </a-table>
        </a-spin>

        <a-divider />
        <a-space>
          <a-button type="primary" html-type="submit" :loading="options.loading">
            <template #icon>
              <icon-font class="icon" type="loncra-send" />
            </template>
            <span>{{ globalProperties.$t('common.send') }}</span>
          </a-button>

          <a-button html-type="reset" :disabled="options.loading">
            <template #icon>
              <icon-font class="icon" type="loncra-history" />
            </template>
            <span>{{ globalProperties.$t('common.reset') }}</span>
          </a-button>
        </a-space>
      </l-form>

    </l-menu-title-card>
  </div>
</template>
