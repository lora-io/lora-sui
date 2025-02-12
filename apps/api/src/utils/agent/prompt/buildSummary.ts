import { Agent } from '@prisma/client'
import { prisma } from '@repo/db'

export async function buildSummary(agent: Agent, groupId: string) {
  const summary = await prisma.messageSummary.findUnique({ where: { groupId } })

  return `The summary of the previous conversation:
<chat_summary>
${summary?.knowledge ?? ''}
</chat_summary>

The user profile of users
<user_profiles>
${summary?.profile ?? ''}
</user_profiles>`
}
