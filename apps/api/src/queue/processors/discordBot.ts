import { Job } from 'bull'
import { initLogger } from '../log'
import { BotQueuePayload } from '../types'
import { discordManager } from '../discord/manager'
import { prisma } from '@repo/db'

export async function processDiscordBotJob(job: Job<BotQueuePayload>) {
  initLogger(job)

  const { action, botToken } = job.data

  if (action === 'add') {
    await discordManager.addBot(botToken)
    return
  }

  if (action === 'remove') {
    const agent = await prisma.agent.findUnique({ where: { discordToken: botToken } })
    if (agent?.discordId) {
      await discordManager.removeBotById(agent.discordId)
    }
    return
  }
}
