import { Job } from 'bull'
import { initLogger } from '../log'
import { botManager } from '../bot/manager'
import { BotQueuePayload, MyContext } from '../types'
import { Telegraf } from 'telegraf'
import { prisma } from '@repo/db'
import { getBotInfoWithRetry } from '../../utils/telegram'
import { UserFromGetMe } from '@telegraf/types'
import { uploadBotAvatarByTelegram } from '../../utils/aws/s3'

export async function processTelegramBotJob(job: Job<BotQueuePayload>) {
  initLogger(job)

  const { action, botToken } = job.data

  switch (action) {
    case 'add':
      await botManager.addBot(botToken)
      break
    case 'remove':
      await botManager.removeBot(botToken)
      break
    case 'update':
      await updateBotInfo(botToken)
      break
  }
}

async function updateBotInfo(botToken: string) {
  const bot = new Telegraf<MyContext>(botToken)

  let botInfo: UserFromGetMe | null = null
  try {
    botInfo = await getBotInfoWithRetry(bot)
  } catch (error: any) {
    const message = error.message?.toLowerCase() ?? ''
    if (message.includes('unauthorized')) {
      console.info(`Bot is unauthorized, removing...${botToken}`)
      await prisma.agent.update({
        where: { botToken },
        data: {
          botToken: null,
          botId: null,
          botUsername: null,
          botFirstName: null,
          botAvatar: null,
        },
      })
    }
    return
  }

  const botId = botInfo.id.toString()
  const telegramUsername = botInfo.username
  const telegramFirstName = botInfo.first_name

  const newBot = await prisma.agent.update({
    where: { botToken },
    data: { botId, botUsername: telegramUsername, botFirstName: telegramFirstName },
  })

  await prisma.telegramUser.upsert({
    where: { id: botId },
    create: { telegramUsername, telegramFirstName, isBot: true, id: botId },
    update: { telegramUsername, telegramFirstName, isBot: true },
  })

  // update avatar
  if (!newBot.botAvatar) {
    try {
      const photos = await bot.telegram.getUserProfilePhotos(botInfo.id)
      const allPhoto = photos.photos[0]
      if (!allPhoto) {
        return
      }

      const photo = allPhoto[allPhoto.length - 1]
      const fileLink = await bot.telegram.getFileLink(photo.file_id)

      const url = await uploadBotAvatarByTelegram(fileLink)
      await prisma.agent.update({
        where: { botToken },
        data: { botAvatar: url },
      })
    } catch (error: any) {
      return { error: error.message }
    }
  }
}
