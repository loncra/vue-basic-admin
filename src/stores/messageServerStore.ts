import {defineStore} from "pinia";
import {MESSAGE_GROUP, STORE} from "@/constants/systemConstant.ts";
import {computed, ref} from "vue";
import type {IdNameMetadata, MessageGroup, MyMessageState, RestResult} from "@/types/apis";
import {MessageServerService} from "@/apis/message-server";

const RESET: MyMessageState = {
  record:{
    [MESSAGE_GROUP.SITE]: {},
    [MESSAGE_GROUP.USER_CHAT]: {}
  },
  siteTypes:[]
}

export const useMessageServerStore = defineStore(STORE.MESSAGE_SERVER_ID, () => {

  const install= ref<boolean>(false)
  const state= ref<MyMessageState>({...RESET})

  /**
   * 重置菜单状态
   * 将菜单数据重置为空数组
   *
   * @returns 重置后的空菜单数组
   */
  function $reset():MyMessageState {
    install.value = false;
    return {...RESET}
  }

  async function installState() {
    state.value.record = await fetchUnreadQuantity()
    const siteTypes:RestResult<IdNameMetadata[]> = await MessageServerService.types(MESSAGE_GROUP.SITE)
    if(siteTypes.data) {
      state.value.siteTypes = siteTypes.data
    }
  }

  function reset() {
    return $reset()
  }

  async function fetchUnreadQuantity():Promise<Record<MessageGroup, Record<number, number>> | undefined> {
    if (install.value) {
      return state.value.record;
    }

    const result:RestResult<Record<MessageGroup, Record<number,number>>> = await MessageServerService.unreadQuantity()
    state.value.record = result?.data || {[MESSAGE_GROUP.SITE]:{}, [MESSAGE_GROUP.USER_CHAT]: {}};
    return state.value.record
  }

  function countUnreadQuantity(group:MessageGroup, ...types:string[]) {
    let result:number = 0;
    const record = state.value?.record?.[group]
    if (!record){
      return result
    }
    if (types && types.length > 0) {
      for (const item of types) {
        result += record?.[Number(item)] || 0
      }
    } else {
      for (const key in record || {}) {
        result += record?.[Number(key)] || 0
      }
    }
    return result
  }

  const getUnreadQuantity = computed(() => (group:MessageGroup, ...types:string[])=> {
    return countUnreadQuantity(group, ...types)
  })

  const getUnreadQuantityByType = computed(() => (type:string) => {
    if (type === 'my_site_message') {
      const types = (state.value?.siteTypes || []).map(v => String(v.id))
      return countUnreadQuantity(MESSAGE_GROUP.SITE, ...types)
    } else if (type === 'my_chat_message') {
      return countUnreadQuantity(MESSAGE_GROUP.USER_CHAT)
    } else if (type === 'my_message') {
      return countUnreadQuantity(MESSAGE_GROUP.SITE) + countUnreadQuantity(MESSAGE_GROUP.USER_CHAT)
    }
    return 0;
  })

  return  {
    state,
    getUnreadQuantity,
    fetchUnreadQuantity,
    getUnreadQuantityByType,
    installState,
    $reset
  }
})
