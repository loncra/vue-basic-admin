import type {Ref} from 'vue'
import type {SenderRef, SlotConfigType} from '@antdv-next/x/dist/sender/interface'
import type {IdValueMetadata} from '@/types/apis'

export interface InstructionMeasure {
  location: number
  prefix: string
  keyword: string
  dataSource: IdValueMetadata<string, string>[]
}

export interface InstructionProps {
  open: boolean
  measure: InstructionMeasure
  activeIndex: number
  anchorStyle: Record<string, string>
  displayDataSource: IdValueMetadata<string, string>[]
}

export interface UseInstructionSenderParams {
  instructionMap: Ref<Record<string, IdValueMetadata<string, string>[]>>
  disabled: Ref<boolean>
  senderRef: Ref<SenderRef | undefined>
  contextVisibleMargin: Ref<number>
  onFilterDataSource: (
    keyword: string,
    dataSource: IdValueMetadata<string, string>[],
    prefix: string,
  ) => IdValueMetadata<string, string>[]
  senderInsertInstruction: (
    sender: SenderRef,
    block: SlotConfigType,
    measure: InstructionMeasure,
  ) => void
}
