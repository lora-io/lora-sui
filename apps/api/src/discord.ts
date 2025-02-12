import fastify from 'fastify'
import { IS_PRODUCTION } from './utils/constants'
import { discordBotQueue, discordMessageQueue } from './queue/queue'
import { discordManager } from './queue/discord/manager'
import { processDiscordBotJob } from './queue/processors/discordBot'
import processDiscordMessageJob from './queue/processors/discordMessage'
import path from 'node:path'

function createServer() {
  discordBotQueue.process(processDiscordBotJob).catch(console.error)
  if (IS_PRODUCTION) {
    discordMessageQueue
      .process(16, path.resolve(__dirname, './queue/processors/discordMessage.js'))
      .catch(console.error)
  } else {
    discordMessageQueue.process(processDiscordMessageJob).catch(console.error)
  }

  const server = fastify({})

  // setup routes
  server.get('/api/health', () => ({ status: 'ok' }))

  const stop = async () => {
    discordManager.stopAll().catch(console.error)
    await server.close()
  }
  const start = async () => {
    try {
      discordManager.startAll().catch(console.error)

      // start server
      await server.listen({ host: IS_PRODUCTION ? '0.0.0.0' : undefined, port: 5002 })
      console.info(`Discord listening at http://localhost:5002`)
    } catch (err) {
      server.log.error(err)
    }
  }

  return { server, start, stop }
}

const server = createServer()
server.start().catch(console.error)

process.once('SIGINT', async () => {
  await server.stop()
  process.exit()
})
process.once('SIGTERM', async () => {
  await server.stop()
  process.exit()
})
