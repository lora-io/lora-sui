import { Action, Context, MessageActionPayload } from '../types'
import { prisma } from '@repo/db'
import { sendDiscordMessage } from '../../utils/discord'

export class DiscordAction extends Action {
  readonly payload: MessageActionPayload

  constructor(payload: MessageActionPayload) {
    super()
    this.payload = payload
  }

  async execute({ agent, artifact }: Context) {
    if (!agent.discordToken) {
      return
    }

    const { text, imageBuffer, message } = this.payload
    const responseContent = text.trim()

    await sendDiscordMessage({
      discordToken: agent.discordToken,
      channelId: message.groupId,
      discordMessageId: message.originMessageId,
      responseContent,
    })

    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        credits: { decrement: 1 },
        creditsUsed: { increment: 1 },
      },
    })

    artifact.message = {
      type: 'discord',
      result: {
        text: responseContent,
        imageBuffer,
      },
    }
  }
}
