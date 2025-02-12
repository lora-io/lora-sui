import { z } from 'zod'
import { protectedProcedure, router } from '../../trpc'
import { prisma } from '@repo/db'
import { TRPCError } from '@trpc/server'

export const agentUpdateRouter = router({
  update: protectedProcedure
    .input(
      z.object({
        agentId: z.string(),
        name: z.string().max(50),
        description: z.string().max(3000),
        personality: z.string().max(1000),
        instruction: z.string().max(6000),
        knowledge: z.string().max(50000).optional(),
      }),
    )
    .mutation(async ({ ctx, input: { agentId, name, description, personality, instruction, knowledge = '' } }) => {
      const oldAgent = await prisma.agent.findUnique({
        where: {
          id: agentId,
          userId: ctx.user.userId,
        },
      })
      if (!oldAgent) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' })
      }

      await prisma.$transaction([
        prisma.agent.update({
          where: { id: agentId, userId: ctx.user.userId },
          data: {
            name,
            description,
            personality,
            instruction,
            knowledge,
          },
        }),
      ])

      return { id: agentId }
    }),

  updateTools: protectedProcedure
    .input(
      z.object({
        agentId: z.string(),
        toolIds: z.array(z.number()),
      }),
    )
    .mutation(async ({ ctx, input: { agentId, toolIds } }) => {
      const agent = await prisma.agent.findUnique({
        where: {
          id: agentId,
          userId: ctx.user.userId,
        },
      })
      if (!agent) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' })
      }

      await prisma.agent.update({
        where: { id: agentId },
        data: { agentTools: { connect: toolIds.map((id) => ({ id })) } },
      })

      return { id: agentId }
    }),
})
