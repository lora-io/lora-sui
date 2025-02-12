import { prisma } from '@repo/db'
import { publicProcedure, router } from '../trpc'

export const publicRouter = router({
  tools: publicProcedure.query(async () => {
    const tools = await prisma.agentTool.findMany({})
    return {
      tools: tools.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
      })),
    }
  }),
})
