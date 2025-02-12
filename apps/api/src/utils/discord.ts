import { purifyMessage, reportError } from './common'
import { ChannelType, Message, REST, Routes } from 'discord.js'

export function isDiscordGroupAdmin(message: Message) {
  if (!message.guild) {
    return false
  }

  const member = message.member
  if (!member) {
    return false
  }

  return member.permissions.has('Administrator')
}

export async function sendDiscordTyping({ discordToken, channelId }: { discordToken: string; channelId: string }) {
  const rest = new REST({ version: '10' }).setToken(discordToken)
  await rest.post(Routes.channelTyping(channelId))
}

export async function sendDiscordMessage({
  discordToken,
  channelId,
  discordMessageId,
  responseContent,
  isRetry = false,
}: {
  discordToken: string
  channelId: string
  discordMessageId?: string | null
  responseContent: string
  isRetry?: boolean
}) {
  try {
    const rest = new REST({ version: '10' }).setToken(discordToken)
    await rest.post(Routes.channelMessages(channelId), {
      body: {
        content: purifyMessage(responseContent),
        message_reference: discordMessageId ? { message_id: discordMessageId } : undefined,
      },
    })
  } catch (error: any) {
    const message = error.message?.toLowerCase() ?? ''
    if (
      message.includes('unauthorized') ||
      message.includes('not found') ||
      message.includes('forbidden') ||
      message.includes('bad request') ||
      message.includes('missing permissions')
    ) {
      return
    }

    if (!isRetry) {
      return sendDiscordMessage({
        discordToken,
        channelId,
        discordMessageId,
        responseContent,
        isRetry: true,
      })
    }

    reportError(error)
    throw error
  }
}
