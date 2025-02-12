import { getDiscordUserDisplayName, getTelegramUserDisplayName } from './utils'
import { Prisma } from '@prisma/client'

type MessageWithUsers = Prisma.MessageGetPayload<{
  include: {
    telegramUser: true
    discordUser: true
  }
}>

export function buildMessageHistory(messages: MessageWithUsers[]) {
  return messages.reverse().map(({ telegramUser, discordUser, text }) => {
    const message = trimMessage(text)
    if (telegramUser) {
      return `${getTelegramUserDisplayName(telegramUser)}: ${message}`
    }
    if (discordUser) {
      return `${getDiscordUserDisplayName(discordUser)}: ${message}`
    }
    return `Anonymous: ${message}`
  })
}

export function trimMessage(message: string) {
  return message.replace(/\n/g, ' ').trim()
}
