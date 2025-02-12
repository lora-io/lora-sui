import fastify from 'fastify'
import { IS_PRODUCTION } from './utils/constants'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import { reportError } from './utils/common'
import { telegramBotQueue, telegramMessageQueue } from './queue/queue'
import { botManager } from './queue/bot/manager'
import { processTelegramBotJob } from './queue/processors/telegramBot'
import path from 'node:path'
import processTelegramMessageJob from './queue/processors/telegramMessage'

function createServer() {
  telegramBotQueue.process(processTelegramBotJob).catch(console.error)
  if (IS_PRODUCTION) {
    telegramMessageQueue
      .process(16, path.resolve(__dirname, './queue/processors/telegramMessage.js'))
      .catch(console.error)
  } else {
    telegramMessageQueue.process(processTelegramMessageJob).catch(console.error)
  }

  const server = fastify({})
  server.register(helmet)
  server.register(cors, { origin: '*' })
  server.register(sensible)
  server.setErrorHandler((error, request, reply) => {
    console.error(error)
    reportError(error)
    return reply.status(error.statusCode ?? 500).send({ message: error.message })
  })

  // setup routes
  server.get('/api/health', () => ({ status: 'ok' }))
  server.post('/bot-webhook/:token', async (request, reply) => {
    const { token } = request.params as { token: string }
    const bot = await botManager.getBotByToken(token)
    if (bot) {
      await bot.handleUpdate(request.body as any, reply.raw)
    } else {
      await reply.send('OK')
    }
  })

  const stop = async () => {
    botManager.stopAll().catch(console.error)
    await server.close()
  }
  const start = async () => {
    try {
      botManager.startAll().catch(console.error)

      // start server
      await server.listen({ host: IS_PRODUCTION ? '0.0.0.0' : undefined, port: 5003 })
      console.info(`Telegram listening at http://localhost:5003`)
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
