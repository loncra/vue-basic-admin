import {defineStore} from "pinia";
import {STORE} from "@/constants/systemConstant.ts";
import {computed, ref} from "vue";
import type {IdNameMetadata, MyMessageState, RestResult} from "@/types/apis";
import {MessageServerService} from "@/apis/message-server";

const RESET: MyMessageState = {
  record:{},
  siteTypes:[]
}

export const useMessageServerStore = defineStore(STORE.MESSAGE_SERVER_ID, () => {

  const install= ref<boolean>(false)
  const state= ref<MyMessageState>({
    record:{},
    siteTypes:[]
  })

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
    const siteTypes:RestResult<IdNameMetadata[]> = await MessageServerService.types('site')
    if(siteTypes.data) {
      state.value.siteTypes = siteTypes.data
    }
  }

  function reset() {
    return $reset()
  }

  async function fetchUnreadQuantity():Promise<Record<number, number> | undefined> {
    if (install.value) {
      return state.value.record;
    }

    const result:RestResult<Record<number, number>> = await MessageServerService.unreadQuantity()
    state.value.record = result?.data || {}
    return state.value.record
  }

  function countUnreadQuantity(...types:string[]) {
    let result:number = 0;
    if (types && types.length > 0) {
      for (const item of types) {
        result += state.value?.record?.[Number(item)] || 0
      }
    } else {
      for (const key in state.value?.record || {}) {
        result += state.value?.record?.[Number(key)] || 0
      }
    }
    return result
  }

  const getUnreadQuantity = computed(() => (...types:string[])=> {
    return countUnreadQuantity(...types)
  })

  const getUnreadQuantityByType = computed(() => (type:string) => {
    if (type === 'my_site_message') {
      return countUnreadQuantity(...(state.value?.siteTypes || []).map(v => v.id))
    } else if (type === 'my_message') {
      return countUnreadQuantity()
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
