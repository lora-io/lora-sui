import { Client, GatewayIntentBits, Message } from 'discord.js'
import { prisma } from '@repo/db'
import { handleDiscordMessage } from './handlers/message'

export async function startDiscord(token: string) {
  return new Promise<{ id: string; client: Client }>((resolve, reject) => {
    const client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    })

    client.on('ready', async () => {
      if (!client.user) {
        reject('Client user not found')
        return
      }
      const { id: discordId, tag: username, displayName } = client.user
      console.log(`Logged in as ${username}`)
      await prisma.agent.update({
        where: { discordToken: token },
        data: {
          discordId,
          discordUsername: username,
          discordDisplayName: displayName,
          discordAvatar: client.user.avatarURL(),
        },
      })
      await prisma.discordUser.upsert({
        where: { id: discordId },
        update: { username, displayName, isBot: true },
        create: { id: discordId, username, displayName, isBot: true },
      })

      resolve({ id: discordId, client })
    })

    client.on('messageCreate', (message: Message) => handleDiscordMessage(client, message))

    client.login(token)

    setTimeout(() => {
      reject('Timeout')
    }, 10_000)
  })
}
