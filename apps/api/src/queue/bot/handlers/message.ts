import { MyBot } from '../../types'
import { prisma } from '@repo/db'
import { isTelegramGroupAdmin, shouldReplyMessage } from '../../../utils/telegram'
import { extractMedia } from './extractMedia'
import { handleTwitterInMessage } from '../../../utils/message'
import { messageSummaryQueue, telegramMessageQueue } from '../../queue'

export function handleMessage(bot: MyBot) {
  bot.use(async (ctx) => {
    if (!ctx.from) {
      return
    }

    const { id: telegramId, username, first_name, last_name } = ctx.from

    // upsert users profile
    {
      const telegramMeta = {
        telegramUsername: username,
        telegramFirstName: first_name,
        telegramLastName: last_name,
      }
      const id = telegramId.toString()
      await prisma.telegramUser.upsert({
        where: { id },
        update: telegramMeta,
        create: { id, ...telegramMeta },
      })
    }

    // only reply group messages
    const isGroup = ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup'
    if (!isGroup || !ctx.message) {
      return
    }

    const botUsername = ctx.me
    const { isReplyToMe, isMentionToMe, shouldReply } = shouldReplyMessage(ctx)

    // validate credits
    const agent = await prisma.agent.findUnique({ where: { botUsername } })
    const credits = agent?.credits
    if (!credits || credits <= 0) {
      console.info(`No credits for @${botUsername}`)
      return
    }

    const groupId = ctx.chat.id.toString()

    const { messageText, fileId } = extractMedia(ctx.message)
    if (!messageText && !fileId) {
      return
    }

    // get image url
    let imageUrl: string | undefined = undefined
    if (fileId) {
      const file = await ctx.telegram.getFileLink(fileId)
      imageUrl = file.href
    }

    // get quote message
    let quoteMessageId: string | undefined = undefined
    if ('reply_to_message' in ctx.message) {
      const replyToMessage = ctx.message.reply_to_message
      if (replyToMessage) {
        const replyToMessageId = `${groupId}_${replyToMessage.message_id}`
        const quoteMessage = await prisma.message.findUnique({ where: { id: replyToMessageId } })
        quoteMessageId = quoteMessage?.id
      }
    }

    console.info(`${username}: message: ${messageText}`)

    const tgMessageId = ctx.message.message_id.toString()
    const loraMessageId = `${groupId}_${tgMessageId}`

    try {
      await prisma.message.upsert({
        where: { id: loraMessageId },
        update: {},
        create: {
          id: loraMessageId,
          groupId,
          threadId: ctx.message.is_topic_message ? ctx.message.message_thread_id?.toString() : null,
          messageId: tgMessageId,
          telegramUserId: telegramId.toString(),
          text: messageText,
          imageUrl,
          quoteMessageId,
        },
      })
    } catch (e) {
      // skip insert error
    }

    // handle reply to twitter
    const isGroupAdmin = await isTelegramGroupAdmin(ctx)
    const twitterResult = handleTwitterInMessage({
      messageText,
      mustReply: isMentionToMe || isReplyToMe,
      isGroupAdmin,
      agent,
      messageId: loraMessageId,
    })

    if (twitterResult) {
      if (twitterResult.error) {
        await ctx.reply(twitterResult.error)
      }
      return
    }

    // only reply messages "to me" or "at me"
    if (!isMentionToMe && !isReplyToMe) {
      return
    }

    // skip messages include only mention someone
    if (/^@\w+$/.test(messageText)) {
      if (isReplyToMe) {
        return
      }
    }

    // send message and update summary
    await telegramMessageQueue.add({ messageId: loraMessageId, agentId: agent.id })
    await messageSummaryQueue.add({ groupId })
  })
}
