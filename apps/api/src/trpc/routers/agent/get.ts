import { z } from 'zod'
import { protectedProcedure, router } from '../../trpc'
import { prisma } from '@repo/db'
import { TRPCError } from '@trpc/server'

export const agentGetRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const agents = await prisma.agent.findMany({
      where: { userId: ctx.user.userId },
      orderBy: { createdAt: 'desc' },
    })
    return agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      personality: agent.personality,
      instruction: agent.instruction,
      credits: Math.max(agent.credits, 0),
      botUsername: agent.botUsername,
      twitterUsername: agent.twitterUsername,
      createdAt: agent.createdAt,
    }))
  }),

  detail: protectedProcedure
    .input(
      z.object({
        agentId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const agent = await prisma.agent.findUnique({
        where: { userId: ctx.user.userId, id: input.agentId },
        include: { agentTools: true },
      })
      if (!agent) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' })
      }
      return {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        personality: agent.personality,
        instruction: agent.instruction,
        knowledge: agent.knowledge ?? '',
        credits: Math.max(agent.credits, 0),
        botUsername: agent.botUsername,
        botAvatar: agent.botAvatar,
        tgGroupLink: agent.tgGroupLink,
        tgGroupTitle: agent.tgGroupTitle,
        twitterUsername: agent.twitterUsername,
        discordUsername: agent.discordUsername,
        discordGroupLink: agent.discordGroupLink,
        createdAt: agent.createdAt,
        tools: agent.agentTools,
        cloudProvider: agent.cloudProvider,
      }
    }),
})
