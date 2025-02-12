import { prisma } from '@repo/db'
import { Agent } from '@prisma/client'
import { buildMessageHistory } from './buildMessages'
import { buildInstruction } from './buildInstruction'
import { buildGoal } from './buildGoal'
import { buildEnding } from './buildEnding'
import { buildBackground } from './buildBackground'
import { buildKnowledge } from './buildKnowledge'
import { buildSummary } from './buildSummary'
import { getDiscordUserDisplayName, getTelegramUserDisplayName } from './utils'

export async function buildMessagePrompt({
  message,
  groupId,
  discordUserId,
  telegramUserId,
  agent,
  isUncensored = false,
}: {
  message: string
  groupId: string
  discordUserId?: string | null
  telegramUserId?: string | null
  agent: Agent
  isUncensored?: boolean
}) {
  const { name, description, personality } = agent

  let userDisplayName: string | null = null
  let botUsername: string = ''
  if (telegramUserId) {
    const user = await prisma.telegramUser.findUnique({ where: { id: telegramUserId } })
    userDisplayName = getTelegramUserDisplayName(user)
    botUsername = agent.botUsername ?? ''
  }
  if (discordUserId) {
    const user = await prisma.discordUser.findUnique({ where: { id: discordUserId } })
    userDisplayName = getDiscordUserDisplayName(user)
    botUsername = agent.discordId ?? ''
  }

  const messages = await prisma.message.findMany({
    include: { telegramUser: true, discordUser: true },
    where: { groupId },
    orderBy: { createdAt: 'desc' },
    take: (isUncensored ? 3 : agent.contextCount) + 1,
  })
  const history = buildMessageHistory(messages)

  return `
You are now ${name}.
${description}

Background:
<background>
${await buildBackground(agent, telegramUserId ? 'telegram' : 'discord')}
</background>

Knowledge:
<knowledge>
${await buildKnowledge(agent, message)}
</knowledge>

Personality:
<personality>
${personality}
</personality>

Goal:
<goal>
${await buildGoal(agent, userDisplayName)}
</goal>

${await buildSummary(agent, groupId)}

The recent chat history is enclosed in <chat_history> tags.
The rows begin with @${botUsername} in the chat history are all your previous responses.
Each message in chat history follows this format: @TelegramUsername (FullName): Message content.
<chat_history>
${history.slice(0, -1).join('\n')}
</chat_history>

Requirements for the response:
<requirements>
${await buildInstruction(agent)}
</requirements>

${await buildEnding(agent, userDisplayName)}
`
}
