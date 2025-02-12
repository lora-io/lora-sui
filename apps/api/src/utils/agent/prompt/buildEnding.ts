import { Agent } from '@prisma/client'

export async function buildEnding(agent: Agent, userDisplayName: string | null) {
  // reply in Telegram
  if (userDisplayName) {
    const texts = [
      `
In latest user message, the message content will be in the format of <user_message> tags, the quoted message content will be in the format of <quoted_message> tags if any. If there is an image, it will also be placed in the user message.
Please embody this character in your responses, taking into account their background, personality, goals, and the specified requirements.
Now respond the user message sent by ${userDisplayName} in text，format your response within tags as shown below:
<response_content>
[Message content of your in-character response in plain text goes here]
</response_content>
`,
    ]
    return texts.map((i) => i.trim()).join('\n')
  }

  // reply in Twitter
  return `
Please embody this character in your message, taking into account their background, personality, goals, and the specified requirements.
Now respond the message you want to send in text，format your message within tags as shown below:
<response_content>
[Content of your in-character message in plain text goes here]
</response_content>
`.trim()
}
