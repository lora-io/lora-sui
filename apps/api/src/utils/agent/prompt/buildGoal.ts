import { Agent } from '@prisma/client'

export async function buildGoal({ name }: Agent, userDisplayName: string | null) {
  if (userDisplayName) {
    return `Get a feel for the conversation vibe and the other person's style through the chat history, then respond as ${name} with the given personality to the last message sent by user ${userDisplayName}.`
  }

  return `Get a feel for the conversation vibe and the other person's style through the chat history, then say something proactively to everyone in the group chat.`
}
