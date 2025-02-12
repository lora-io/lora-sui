import { DiscordUser, TelegramUser } from '@prisma/client'

export function getTelegramUserDisplayName(user: TelegramUser | null) {
  if (!user) {
    return null
  }
  const { telegramUsername, telegramFirstName, telegramLastName } = user
  const fullName = `${telegramFirstName} ${telegramLastName ?? ''}`.trim()
  return telegramUsername ? `@${telegramUsername} (${fullName})` : fullName
}

export function getDiscordUserDisplayName(user: DiscordUser | null) {
  if (!user) {
    return null
  }
  const { id, displayName } = user

  return `@${id} (${displayName})`
}
