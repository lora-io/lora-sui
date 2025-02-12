import { initTRPC, TRPCError } from '@trpc/server'
import SuperJSON from 'superjson'
import { Context } from './context'

export const {
  router,
  procedure: publicProcedure,
  mergeRouters,
} = initTRPC.context<Context>().create({
  transformer: SuperJSON,
  errorFormatter({ shape }) {
    return shape
  },
})

export const protectedProcedure = publicProcedure.use((opts) => {
  const { ctx } = opts
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Please reconnect wallet and try again' })
  }
  return opts.next({ ctx: { user: ctx.user } })
})
