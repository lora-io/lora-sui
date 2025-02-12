import { Client, Message } from 'discord.js'
import { prisma } from '@repo/db'
import { discordMessageQueue, messageSummaryQueue } from '../../queue'
import { isDiscordGroupAdmin } from '../../../utils/discord'
import { handleTwitterInMessage } from '../../../utils/message'

export async function handleDiscordMessage(client: Client, message: Message) {
  if (!message.content || !client.user) {
    return
  }

  const discordId = client.user.id
  const channelId = message.channel.id
  const discordMessageId = message.id
  const userId = message.author.id
  const username = message.author.username
  const displayName = message.author.displayName
  const text = message.content
  const imageUrl = message.attachments.first()?.url
  const quoteMessageId = message.reference?.messageId
  const quoteId = quoteMessageId ? `${channelId}_${quoteMessageId}` : null
  const quoteMessage = quoteId ? await prisma.message.findUnique({ where: { id: quoteId } }) : null

  // skip self messages
  if (userId === discordId) {
    return
  }

  // store message in database
  const [, loraMessage] = await prisma.$transaction([
    prisma.discordUser.upsert({
      where: { id: userId },
      update: { username, displayName },
      create: { username, displayName, id: userId },
    }),
    prisma.message.upsert({
      where: { id: `${channelId}_${discordMessageId}` },
      update: {},
      create: {
        id: `${channelId}_${discordMessageId}`,
        groupId: channelId,
        discordUserId: userId,
        text,
        imageUrl,
        messageId: discordMessageId,
        quoteMessageId: quoteMessage?.id,
      },
    }),
  ])

  const isMentionToMe = message.mentions.has(client.user)

  const agent = await prisma.agent.findUnique({ where: { discordId } })
  if (!agent) {
    return
  }

  // handle reply to twitter
  const isGroupAdmin = isDiscordGroupAdmin(message)
  const twitterResult = handleTwitterInMessage({
    messageText: text,
    mustReply: isMentionToMe,
    isGroupAdmin,
    agent,
    messageId: loraMessage.id,
  })

  if (twitterResult) {
    if (twitterResult.error) {
      await message.reply(twitterResult.error)
    }
    return
  }

  // skip if not mentioned
  if (!isMentionToMe) {
    return
  }

  await discordMessageQueue.add({ messageId: loraMessage.id, agentId: agent.id })
  await messageSummaryQueue.add({ groupId: channelId })
}
