import { Agent } from '@prisma/client'
import { extractTwitterLink } from './twitter'

export function handleTwitterInMessage({
  messageText,
  mustReply,
  agent,
}: {
  messageText: string
  mustReply: boolean
  isGroupAdmin: boolean
  agent: Agent
  messageId: string
}): { error?: string } | undefined {
  const text = messageText
    .trim()
    .toLowerCase()
    .replace(/twitter\.com/g, 'x.com')

  const twitterLink = extractTwitterLink(text)
  const isReplyX = text.toLowerCase().includes('/reply')
  const isQuoteX = text.toLowerCase().includes('/quote')
  const hasX = !!twitterLink
  const shouldSkip = !mustReply && messageText.includes('@')

  if (!hasX || shouldSkip) {
    return
  }

  if (!agent.twitterUsername) {
    if (mustReply) {
      return { error: 'Please bind your Twitter account first.' }
    }
    return
  }

  if (isReplyX || isQuoteX) {
    return { error: 'Sorry, only group admins can do this.' }
  }
}
