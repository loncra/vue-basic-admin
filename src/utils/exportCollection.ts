import {message} from 'antdv-next'
import {exportCollectionData} from '@loncra/antdv-pro'
import {RESOURCE_SERVER_USER_EXPORT_ROUTE} from '@/constants'
import router from '@/routers'

export async function exportCollectionToView(
  options: Parameters<typeof exportCollectionData>[0],
): Promise<void> {
  const result = await exportCollectionData(options)
  message.success(result.message)
  void router.push({name: RESOURCE_SERVER_USER_EXPORT_ROUTE})
}
