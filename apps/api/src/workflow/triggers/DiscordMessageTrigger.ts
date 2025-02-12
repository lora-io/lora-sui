import { Context, MessageTriggerPayload, Trigger, TriggerType } from '../types'
import { Agent } from '@prisma/client'
import { prisma } from '@repo/db'
import { ReplyMessageTask } from '../tasks/ReplyMessageTask'

export class DiscordMessageTrigger extends Trigger {
  readonly type = TriggerType.DiscordMessage
  readonly agent: Agent
  readonly payload: MessageTriggerPayload

  constructor(payload: MessageTriggerPayload) {
    super()
    this.payload = payload
    this.agent = payload.agent
  }

  async buildTasks(context: Context) {
    if (!this.agent.discordId) {
      return []
    }
    const message = await prisma.message.findUnique({
      where: { id: this.payload.messageId },
      include: { quoteMessage: true },
    })
    if (!message) {
      return []
    }

    context.sendDiscordTyping(message.groupId)

    context.workspace.messageToReply = message

    return [ReplyMessageTask]
  }
}
