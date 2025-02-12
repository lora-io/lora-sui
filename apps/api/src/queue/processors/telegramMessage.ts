import { Job } from 'bull'
import { initLogger } from '../log'
import { MessageQueuePayload } from '../types'
import { prisma } from '@repo/db'
import { Workflow } from '../../workflow'
import { TriggerType } from '../../workflow/types'

export default async function processTelegramMessageJob(job: Job<MessageQueuePayload>) {
  initLogger(job)

  const { messageId, agentId } = job.data
  const message = await prisma.message.findUnique({ where: { id: messageId } })
  const agent = await prisma.agent.findUnique({ where: { id: agentId } })
  if (!agent || !agent.botToken || !message) {
    throw new Error(`Agent not found: ${agentId}`)
  }

  let type: TriggerType
  if (message.telegramUserId) {
    type = TriggerType.TelegramMessage
  } else if (message.discordUserId) {
    type = TriggerType.DiscordMessage
  } else {
    return
  }

  return await Workflow.Start({ type, payload: { agent, messageId } })
}
