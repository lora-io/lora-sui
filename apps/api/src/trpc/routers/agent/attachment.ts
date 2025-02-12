import { z } from 'zod'
import { protectedProcedure, router } from '../../trpc'
import { prisma } from '@repo/db'
import { TRPCError } from '@trpc/server'
import { LinkContentExtractor } from '../../../utils/readability'
import { vectorDB } from '../../../utils/rag'

export const agentAttachmentRouter = router({
  updateAttachment: protectedProcedure
    .input(
      z.object({
        agentId: z.string(),
        attachmentId: z.number().optional(),
        attachmentLink: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input: { agentId, attachmentId, attachmentLink: link } }) => {
      const oldAgent = await prisma.agent.findUnique({
        where: { id: agentId, userId: ctx.user.userId },
      })
      if (!oldAgent) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agent not found' })
      }

      // delete attachment
      if (attachmentId) {
        await prisma.$transaction([
          prisma.embedding.deleteMany({
            where: { agentAttachmentId: attachmentId },
          }),
          prisma.agentAttachment.delete({
            where: { id: attachmentId, agentId },
          }),
        ])
        return { id: agentId }
      }

      // add attachment
      if (link) {
        if (oldAgent.credits < 1) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not enough credits' })
        }
        const existing = await prisma.agentAttachment.count({
          where: { agentId, link },
        })
        if (existing > 0) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'The link already exists' })
        }
        const { content } = await LinkContentExtractor.extractFromUrl(link)
        const agentAttachment = await prisma.agentAttachment.create({
          data: { agentId, title: '', description: '', link, content },
        })

        await vectorDB.addText({ text: content, attachment: agentAttachment })

        return { id: agentId }
      }

      return { id: agentId }
    }),

  listAttachments: protectedProcedure.input(z.object({ agentId: z.string() })).query(async ({ input: { agentId } }) => {
    const attachments = await prisma.agentAttachment.findMany({
      where: { agentId },
      orderBy: { createdAt: 'desc' },
    })
    return attachments.map((attachment) => ({
      id: attachment.id,
      link: attachment.link,
      content: attachment.content,
    }))
  }),
})
