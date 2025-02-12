import { authRouter } from './routers/auth'
import { agentRouter } from './routers/agent'
import { router } from './trpc'
import { publicRouter } from './routers/public'

export const appRouter = router({
  auth: authRouter,
  agent: agentRouter,
  public: publicRouter,
})

export type AppRouter = typeof appRouter
