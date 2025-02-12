import helmet from '@fastify/helmet'
import cors from '@fastify/cors'
import { fastifyTRPCPlugin, FastifyTRPCPluginOptions } from '@trpc/server/adapters/fastify'
import { createContext } from './trpc/context'
import { AppRouter, appRouter } from './trpc/router'
import sensible from '@fastify/sensible'
import cookie from '@fastify/cookie'
import fastify from 'fastify'
import { IS_PRODUCTION } from './utils/constants'
import { reportError } from './utils/common'

function createServer() {
  const server = fastify()

  server.register(helmet)
  server.register(cors, { origin: '*', credentials: true })
  server.register(cookie, {
    parseOptions: {
      sameSite: 'none',
      secure: true,
    },
  })
  server.register(sensible)
  server.setErrorHandler((error, request, reply) => {
    console.error(error)
    reportError(error)
    const { name, message } = error
    let fullMessage = ''
    if (name.length > 0) {
      fullMessage = message.length > 0 ? `${name}: ${message}` : name
    } else {
      fullMessage = message.length > 0 ? message : 'Unknown Error'
    }
    return reply.status(error.statusCode ?? 500).send({ message: fullMessage })
  })

  server.register(fastifyTRPCPlugin, {
    prefix: '/api',
    trpcOptions: {
      router: appRouter,
      createContext,
    } satisfies FastifyTRPCPluginOptions<AppRouter>['trpcOptions'],
  })

  const stop = async () => {
    await server.close()
  }
  const start = async () => {
    try {
      console.info(`API listening at http://localhost:5000`)
      await server.listen({
        host: IS_PRODUCTION ? '0.0.0.0' : undefined,
        port: 5000,
      })
    } catch (err) {
      server.log.error(err)
    }
  }

  return { server, start, stop }
}

const server = createServer()
void server.start()

process.once('SIGINT', async () => {
  await server.stop()
  process.exit()
})
process.once('SIGTERM', async () => {
  await server.stop()
  process.exit()
})
