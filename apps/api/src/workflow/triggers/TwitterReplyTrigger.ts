import { Context, Trigger, TriggerType, TwitterTriggerPayload } from '../types'
import { Agent } from '@prisma/client'
import { ReplyTwitterTask } from '../tasks/ReplyTwitterTask'
import { prisma } from '@repo/db'

export class TwitterReplyTrigger extends Trigger {
  readonly type = TriggerType.TwitterReply
  readonly agent: Agent
  readonly payload: TwitterTriggerPayload

  constructor(payload: TwitterTriggerPayload) {
    super()
    this.payload = payload
    this.agent = payload.agent
  }

  async buildTasks(context: Context) {
    const { action, twitterId, messageId } = this.payload
    context.workspace.messageToReply = await prisma.message.findUnique({ where: { id: messageId } })

    if (action === 'reply') {
      context.workspace.twitterIdToReply = twitterId
    }
    if (action === 'quote') {
      context.workspace.twitterIdToQuote = twitterId
    }
    return [ReplyTwitterTask]
  }
}
