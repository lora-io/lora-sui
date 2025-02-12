// for tasks
import { Message } from '@prisma/client'
import { UserMessage } from '../../utils/types'

export type Workspace = {
  messageToReply?: Message | null
  twitterIdToReply?: string
  twitterIdToQuote?: string

  messages?: UserMessage[]
}
