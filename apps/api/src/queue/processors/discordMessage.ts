import { Job } from 'bull'
import { initLogger } from '../log'
import { MessageQueuePayload } from '../types'
import { prisma } from '@repo/db'
import { Workflow } from '../../workflow'
import { TriggerType } from '../../workflow/types'

export default async function processDiscordMessageJob(job: Job<MessageQueuePayload>) {
  initLogger(job)

  const { messageId, agentId } = job.data
  const agent = await prisma.agent.findUnique({ where: { id: agentId } })
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`)
  }

  return await Workflow.Start({
    type: TriggerType.DiscordMessage,
    payload: { agent, messageId },
  })
}
