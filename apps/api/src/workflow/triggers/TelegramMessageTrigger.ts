import { Context, MessageTriggerPayload, Trigger, TriggerType } from '../types'
import { ReplyMessageTask } from '../tasks/ReplyMessageTask'
import { Agent } from '@prisma/client'
import { prisma } from '@repo/db'

export class TelegramMessageTrigger extends Trigger {
  readonly type = TriggerType.TelegramMessage
  readonly agent: Agent
  readonly payload: MessageTriggerPayload

  constructor(payload: MessageTriggerPayload) {
    super()
    this.payload = payload
    this.agent = payload.agent
  }

  async buildTasks(context: Context) {
    const message = await prisma.message.findUnique({
      where: { id: this.payload.messageId },
      include: { quoteMessage: true },
    })

    if (!message || !this.agent.botToken) {
      return []
    }

    context.sendTelegramTyping(message.groupId, message.threadId)
    context.workspace.messageToReply = message

    return [ReplyMessageTask]
  }
}
