import { Agent } from '@prisma/client'
import { vectorDB } from '../../rag'

export async function buildKnowledge(agent: Agent, message: string) {
  const ragContext = await vectorDB.searchSimilar({ agentId: agent.id, searchQuery: message })

  return `
You are built on LORA, a modular AI agent platform on SUI.
${agent.knowledge ?? ''}
${ragContext}
`.trim()
}
