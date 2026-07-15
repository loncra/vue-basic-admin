import {type ComponentInternalInstance, getCurrentInstance} from "vue";
import {requireNonNullOrUndefined} from "@/utils";

export function useAgentConversation() {

  const globalProperties = requireNonNullOrUndefined<ComponentInternalInstance>(
    getCurrentInstance(),
  ).appContext.config.globalProperties

  return {
  }
}
