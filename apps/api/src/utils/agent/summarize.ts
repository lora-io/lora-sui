import { generateWithAI } from '../ai/generateWithAI'

import { extract } from '../../queue/bot/extract'

export async function generateSummary(
  previous: { knowledge: string | null; profile: string | null } | null,
  history: string[],
) {
  const systemPrompt = `
You are a professional chat history analyst. Your task is to analyze the content of group chat conversations.

The chat history is enclosed in <chat_history> tags.
Each message in chat history follows this format:
<message_format>@UserName (FullName): Message content</message_format>

Previous summary:
<previous_summary>
${previous?.knowledge ?? ''}
</previous_summary>

Previous profiles:
<previous_profile>
${previous?.profile ?? ''}
</previous_profile>

Now help me:
1. Extract useful knowledge or news or information from it, to be used as context for future conversations, put in <knowledge>[knowledge goes here]</knowledge> tag
2. Summarize and analyze the personalities of each individual in less than 3 sentences, to quickly understand a user, put into <profile>[profiles goes here]</profile> tag
3. put "FINISH" in <end></end> tag at the end of the response

Example of good response is wrapped in <example> tags for structure:
<example>
<knowledge>
- Truth Terminal is an AI chatbot which gained popularity and financial success by interacting with the cryptocurrency world.
</knowledge>
<profile>
- @user_a (User A): User A is a cryptocurrency enthusiast who is interested in the latest trends and news.
</profile>
<end>FINISH</end>
</example>

Please generate the entire content, and ensure that each tag is fully closed.
`

  const { output } = await generateWithAI({
    system: systemPrompt,
    messages: [
      {
        type: 'text',
        text: `
<chat_history>
${history.join('\n')}
</chat_history>`.trim(),
      },
    ],
  })

  return {
    output,
    knowledge: extract(output, 'knowledge'),
    profile: extract(output, 'profile'),
  }
}
