import useApp from "antdv-next/dist/app/useApp";
import type {MessageGroup} from "@/types/apis";
import {MESSAGE_GROUP} from "@/constants/messageConstant.ts";
import {h, nextTick} from "vue";
import {Typography} from "antdv-next";
import type {ArgsProps} from "antdv-next/dist/notification";

const notificationKeyCache:Record<string, Set<string>> = {}

export function useAppNotification() {
  const { notification } = useApp();

  function getNotificationKey(type:MessageGroup) {
    return notificationKeyCache[type];
  }

  async function addNotificationKey(type:MessageGroup, key:string) {
    const keys:Set<string> = getNotificationKey(type) || new Set()
    if (keys.has(key)) {
      destroy(key)
      await nextTick()
    }
    keys.add(key)
    notificationKeyCache[type] = keys
  }

  function createNotificationDescription(text: string) {
    if (!text) {
      return ''
    }
    return h(
      Typography.Paragraph,
      {
        class: 'm-0! text-text-secondary',
        ellipsis: {rows: 2},
      },
      () => text,
    )
  }

  async function info( props:ArgsProps, type:MessageGroup = MESSAGE_GROUP.DEFAULT,key:string = crypto.randomUUID()) {
    await addNotificationKey(type, key)
    notification.info({
      ...{
        key,
        classes:{
          root: 'cursor-pointer',
          icon: 'leading-normal! text-inherit flex items-center',
          title: 'font-medium'
        }
      },
      ...props,
    })
  }

  function destroy(key:string) {
    notification.destroy(key)
    for (const key in notificationKeyCache) {
      const keys = notificationKeyCache[key] as Set<string>
      keys.delete(key)
    }
  }

  return  {
    info,
    destroy,
    getNotificationKey,
    createNotificationDescription
  }

}
