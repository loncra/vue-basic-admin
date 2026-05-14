<template>
  <div>
    <menu-card-component :loading="options.loading">

      <a-descriptions bordered layout="vertical" class="margin-lg-bottom" :column="{ xxl: 4, xl: 4, lg: 2, md: 2, sm: 1, xs: 1 }">

        <a-descriptions-item label="审计 id">{{ options.form.id }}</a-descriptions-item>
        <a-descriptions-item label="操作人">{{ options.form.principal }}</a-descriptions-item>
        <a-descriptions-item label="操作时间">{{ globalProperties.dateTimeFormat(Math.round(options.form.timestamp * 1000)) }}</a-descriptions-item>
        <a-descriptions-item label="审计类型">{{ options.form.type }}</a-descriptions-item>
        <template v-if="options.form?.data?.executionEndTime">
          <a-descriptions-item  label="执行时间" :span="2" >
            {{ options.form.data.executionEndTime }}
          </a-descriptions-item>
          <a-descriptions-item label="执行结果" :span="2" >
            <a-badge :status="options.form.type.endsWith('SUCCESS') ? 'success' : 'error'" :text="options.form.type.endsWith('SUCCESS') ? '成功' : '失败'" />
          </a-descriptions-item>
          <a-descriptions-item label="异常信息" :span="4"  v-if="options.form?.data?.exception">
            {{options.form.data.exception}}
          </a-descriptions-item>
        </template>
      </a-descriptions>

      <template v-if="options.form?.data?.details || false">
        <a-divider orientation="left">
          <icon-font class="icon" type="icon-file"/>
          <span class="hidden-md hidden-sm hidden-xs">操作人详情</span>
        </a-divider>
        <a-descriptions bordered :column="{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }" class="margin-top-lg">
          <a-descriptions-item v-for="(value, key) in options.form.data.details" :key="key" :label="key">
            {{ value }}
          </a-descriptions-item>
        </a-descriptions>
      </template>

      <template v-if="options.form?.data?.header">
        <a-divider orientation="left">
          <icon-font class="icon" type="icon-file"/>
          <span class="hidden-md hidden-sm hidden-xs">请求头信息</span>
        </a-divider>
        <a-descriptions bordered :column="{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }" class="margin-top-lg">
          <a-descriptions-item v-for="(value, key) in options.form.data.header" :key="key" :label="key">
            {{ value }}
          </a-descriptions-item>
        </a-descriptions>
      </template>

      <template v-if="options.form?.data?.body">
        <a-divider orientation="left">
          <icon-font class="icon" type="icon-file"/>
          <span class="hidden-md hidden-sm hidden-xs">请求体信息</span>
        </a-divider>
        <a-descriptions bordered :column="{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }" class="margin-top-lg">
          <a-descriptions-item v-for="(value, key) in options.form.data.body" :key="key" :label="key">
            {{ value }}
          </a-descriptions-item>
        </a-descriptions>
      </template>

      <template v-if="options.form?.data?.parameter">
        <a-divider orientation="left">
          <icon-font class="icon" type="icon-file"/>
          <span class="hidden-md hidden-sm hidden-xs">请求参数信息</span>
        </a-divider>

        <a-descriptions bordered :column="{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }" class="margin-top-lg">
          <a-descriptions-item v-for="(value, key) in options.form.data.parameter" :key="key" :label="key">
            {{ value }}
          </a-descriptions-item>
        </a-descriptions>
      </template>

      <template v-if="options.form?.data?.operationDataTrace">
        <a-divider orientation="left">
          <icon-font class="icon" type="icon-file"/>
          <span class="hidden-md hidden-sm hidden-xs">操作数据</span>
        </a-divider>

        <a-descriptions bordered :column="{ xxl: 1, xl: 1, lg: 1, md: 1, sm: 1, xs: 1 }" class="margin-top-lg">
          <a-descriptions-item v-for="(value, key) in options.form.data.operationDataTrace" :key="key" :label="key">
            {{ value }}
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </menu-card-component>
  </div>
</template>

<script setup>

import {getAuditEventDetail} from '@/apis/authenticationApi.js'
import MenuCardComponent from '@/components/base/MenuCardComponent.vue'
import {getCurrentInstance, onMounted, ref} from 'vue'

const globalProperties = getCurrentInstance().appContext.config.globalProperties;

const options = ref({
  loading:false,
  form: {
    id:undefined,
    principal:"",
    timestamp:0,
    type:"",
    data:{}
  }
});

function mounted() {
  const data = [];

  if (!globalProperties.$route.query.id) {
    data.push({code:"400",field:'id',defaultMessage:'id 不能为空'});
  }

  if (!globalProperties.$route.query.after) {
    data.push({code:"400",field:'after',defaultMessage:'after 不能为空'});
  }

  if(data.length > 0) {
    sessionStorage.setItem(import.meta.env.VITE_APP_SESSION_STORAGE_BAD_REQUEST_NAME, JSON.stringify(data));
    globalProperties.$router.push({name:"400"});
    return ;
  }

  options.value.loading = true;

  getAuditEventDetail(globalProperties.$route.query.id, globalProperties.$route.query.after)
    .then(r => options.value.form = r.data.data).then(() => options.value.loading = false)
    .catch(() => options.value.loading = false);
}

onMounted(mounted)

</script>
