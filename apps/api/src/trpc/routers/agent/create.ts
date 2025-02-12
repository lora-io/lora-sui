import { z } from 'zod'
import { protectedProcedure, router } from '../../trpc'
import { prisma } from '@repo/db'

export const agentCreateRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().max(50),
        mode: z.string(),
        description: z.string().max(3000),
        personality: z.string().max(1000),
        instruction: z.string().max(6000),
        cloudProvider: z.string(),
      }),
    )
    .mutation(async ({ ctx, input: { name, description, mode, personality, instruction, cloudProvider } }) => {
      const agent = await prisma.agent.create({
        data: {
          name,
          description,
          personality,
          instruction,
          userId: ctx.user.userId,
          credits: 100,
          cloudProvider,
        },
      })
      return { id: agent.id }
    }),
})
