import { Action, Context, MessageActionPayload } from '../types'
import { sendTelegramMessage } from '../../utils/telegram'
import { prisma } from '@repo/db'
import { uploadArtifactImage } from '../../utils/aws/s3'

export class TelegramAction extends Action {
  readonly payload: MessageActionPayload

  constructor(payload: MessageActionPayload) {
    super()
    this.payload = payload
  }

  async execute({ agent, telegramBot, artifact }: Context) {
    if (!agent.botId || !telegramBot) {
      return
    }

    const { loraMessageId, groupId, threadId, originMessageId } = this.payload.message
    const { text, imageBuffer } = this.payload
    const responseContent = text.trim()

    const newMessageId = await sendTelegramMessage({
      telegram: telegramBot.telegram,
      chatId: this.payload.message.groupId,
      threadId: threadId ? parseInt(threadId) : undefined,
      replyToMessageId: originMessageId ? parseInt(originMessageId) : undefined,
      responseContent,
      imageBuffer,
    })

    if (newMessageId) {
      const imageUrl = imageBuffer ? await uploadArtifactImage(imageBuffer) : null
      await prisma.message.upsert({
        where: { id: `${groupId}_${newMessageId}` },
        update: {},
        create: {
          id: `${groupId}_${newMessageId}`,
          groupId,
          threadId,
          messageId: newMessageId.toString(),
          telegramUserId: agent.botId,
          text: responseContent,
          imageUrl,
          quoteMessageId: loraMessageId,
        },
      })

      artifact.message = {
        type: 'telegram',
        result: {
          text: responseContent,
          imageBuffer,
        },
      }
    }
  }
}
