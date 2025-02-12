import fastify from 'fastify'
import { IS_PRODUCTION } from './utils/constants'
import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import { reportError } from './utils/common'
import { ALL_QUEUES, cacheQueue, manualQueue, messageSummaryQueue } from './queue/queue'
import { processCacheJob } from './queue/processors/cache'
import { FastifyAdapter } from '@bull-board/fastify'
import { createBullBoard } from '@bull-board/api'
import { BullAdapter } from '@bull-board/api/bullAdapter'
import { processManualJob } from './queue/processors/manual'
import { processMessageSummaryJob } from './queue/processors/messageSummary'

function createServer() {
  manualQueue.process(processManualJob).catch(console.error)
  cacheQueue.process(processCacheJob).catch(console.error)
  messageSummaryQueue.process(processMessageSummaryJob).catch(console.error)

  const server = fastify({})
  server.register(helmet)
  server.register(cors, { origin: '*' })
  server.register(sensible)
  server.setErrorHandler((error, request, reply) => {
    console.error(error)
    reportError(error)
    return reply.status(error.statusCode ?? 500).send({ message: error.message })
  })

  // setup the queue dashboard
  const serverAdapter = new FastifyAdapter()
  createBullBoard({ queues: ALL_QUEUES.map((queue) => new BullAdapter(queue)), serverAdapter })
  server.register(serverAdapter.registerPlugin())

  // setup routes
  server.get('/api/health', () => ({ status: 'ok' }))

  const stop = async () => {
    await server.close()
  }
  const start = async () => {
    try {
      // update cache
      const jobs = await cacheQueue.getRepeatableJobs()
      for (const job of jobs) {
        await cacheQueue.removeRepeatableByKey(job.key)
      }
      await cacheQueue.add({}, { repeat: { every: 60_000 } })

      // start server
      await server.listen({ host: IS_PRODUCTION ? '0.0.0.0' : undefined, port: 5001 })
      console.info(`Queue listening at http://localhost:5001`)
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
