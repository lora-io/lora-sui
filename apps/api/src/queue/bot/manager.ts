import { MyBot, MyContext } from '../types'
import { Telegraf } from 'telegraf'
import { handleMessage } from './handlers/message'
import { prisma } from '@repo/db'
import { IS_PRODUCTION } from '../../utils/constants'
import { sleep } from '../../utils/common'
import { telegramBotQueue } from '../queue'

class BotManager {
  private bots: { [token: string]: MyBot } = {}
  private isStarted = false

  async getBotByToken(token: string, retry = 0): Promise<MyBot | undefined> {
    if (!this.isStarted && retry < 5) {
      await sleep(2000)
      return this.getBotByToken(token, retry + 1)
    }
    return this.bots[token]
  }

  async addBot(token: string) {
    if (this.bots[token]) {
      return
    }

    const bot = new Telegraf<MyContext>(token)
    await telegramBotQueue.add({ action: 'update', botToken: token })

    handleMessage(bot)

    bot.catch((error) => console.error(error))
    this.bots[token] = bot

    if (IS_PRODUCTION) {
      bot
        .launch({
          webhook: {
            domain: 'https://api.mylora.xyz',
            path: `/bot-webhook/${token}`,
          },
        })
        .catch(console.error)
    } else {
      bot.launch().catch(console.error)
    }

    const agent = await prisma.agent.findUnique({ where: { botToken: token } })
    console.info(`Bot @${agent?.botUsername}(${agent?.botFirstName}) started`)
  }

  async removeBot(token: string) {
    const bot = this.bots[token]
    if (!bot) {
      return
    }
    bot.stop()
    delete this.bots[token]

    const agent = await prisma.agent.findUnique({ where: { botToken: token } })
    console.info(`Bot @${agent?.botUsername}(${agent?.botFirstName}) removed`)
  }

  async startAll() {
    const agents = await prisma.agent.findMany({ where: { botToken: { not: null } } })
    for (const agent of agents) {
      if (agent.botToken) {
        try {
          await this.addBot(agent.botToken)
        } catch (e) {
          console.error('Failed to start bot', agent.botToken, e)
        }
      }
    }
    this.isStarted = true
  }

  async stopAll() {
    for (const token of Object.keys(this.bots)) {
      try {
        await this.removeBot(token)
      } catch (e) {
        console.error('Failed to stop bot', token, e)
      }
    }
    this.isStarted = false
  }
}

export const botManager = new BotManager()
