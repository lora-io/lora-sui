import { Job } from 'bull'
import { initLogger } from '../log'
import { SummaryQueuePayload } from '../types'
import { prisma } from '@repo/db'
import { generateSummary } from '../../utils/agent/summarize'
import { buildMessageHistory } from '../../utils/agent/prompt/buildMessages'

export async function processMessageSummaryJob(job: Job<SummaryQueuePayload>) {
  initLogger(job)

  const { groupId } = job.data

  const lastSummary = await prisma.messageSummary.findUnique({ where: { groupId } })
  const messages = await prisma.message.findMany({
    include: { telegramUser: true, discordUser: true },
    where: {
      groupId,
      createdAt: lastSummary ? { gt: lastSummary.updatedAt } : undefined,
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  if (messages.length < 5) {
    await job.log(`Not enough messages: ${messages.length}`)
    return
  }

  await job.log(`Summarizing group messages: ${groupId}`)
  const lastMessageId = messages[0].id

  const history = buildMessageHistory(messages)

  const { output, knowledge, profile } = await generateSummary(lastSummary, history)
  const summary = knowledge

  if (!summary || !knowledge || !profile) {
    await job.log(`Output: ${output}`)
    throw new Error(`Summary is empty: ${JSON.stringify({ knowledge, profile })}`)
  }

  await prisma.messageSummary.upsert({
    where: { groupId },
    create: {
      groupId,
      summary,
      knowledge,
      profile,
      lastMessageId,
    },
    update: {
      summary,
      knowledge,
      profile,
      lastMessageId,
    },
  })

  return {
    knowledge,
    profile,
  }
}
