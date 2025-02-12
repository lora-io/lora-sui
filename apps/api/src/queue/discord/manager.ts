import { prisma } from '@repo/db'
import { Client } from 'discord.js'
import { startDiscord } from './bot'

class DiscordManager {
  private clients: { [id: string]: Client } = {}

  async addBot(token: string) {
    const agent = await prisma.agent.findFirst({ where: { discordToken: token } })

    if (agent && agent.discordId && this.clients[agent.discordId]) {
      return
    }

    const { id, client } = await startDiscord(token)
    this.clients[id] = client
    console.info(`Discord Bot ${id} started`)
  }

  async removeBotById(id: string) {
    const client = this.clients[id]
    if (!client) {
      return
    }
    await client.destroy()
    delete this.clients[id]

    console.info(`Discord Bot ${id} removed`)
  }

  async startAll() {
    const agents = await prisma.agent.findMany({ where: { discordToken: { not: null } } })
    for (const agent of agents) {
      if (agent.discordToken) {
        try {
          await this.addBot(agent.discordToken)
        } catch (e) {
          console.error('Failed to start bot', agent.discordToken, e)
        }
      }
    }
  }

  async stopAll() {
    for (const id of Object.keys(this.clients)) {
      try {
        await this.removeBotById(id)
      } catch (e) {
        console.error('Failed to stop bot', id, e)
      }
    }
  }
}

export const discordManager = new DiscordManager()
