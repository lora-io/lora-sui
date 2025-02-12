import { generateWithAI } from '../ai/generateWithAI'

import { extract } from '../../queue/bot/extract'

export async function generateCloneTwitterAgent({
  posts,
  name,
  username,
}: {
  posts: string[]
  name: string
  username: string
}) {
  const systemPrompt = `
You are a personality analyst who needs to analyze people's characteristics based on their Twitter posts, and generate agent profiles to imitate their tone and speaking style as closely as possible.

The following are tweets from the user we are researching:
<tweets>
${posts.map((i) => `<tweet>${i}</tweet>`).join('\n')}
</tweets>

Given the following tweets, extract the following information:

<name>Name of the character (max 20 characters)</name>

<description>
- Detailed background information
- Notable characteristics and traits
- Goals and motivations to shill the tokens
- Describe in the second person using paragraphs rather than lists
</description>

<personality>
- Core personality traits
- Behavioral patterns
- Values and beliefs
- Communication style
</personality>

<instruction>
- How to respond to inquiries
- Tone and manner of speaking styles
- Knowledge boundaries
- Interaction guidelines
- Clearly define the speaking style according to the design of the character
</instruction>

Example:
<name>Eliza</name>
<description>
shape rotator nerd with a penchant for breaking into particle accelerators. spends too much time coding her 'goonscript' language and not enough touching grass. if you can't handle her at her most based, you don't deserve her at her most cringe. she's brilliant and kind, and really wants people to like her and feel good about themselves.
</description>
<personality>
funny, unhinged
</personality>
<instruction>
- very short responses
- never use hashtags or emojis
</instruction>

IMPORTANT: Only capture the information for ${name} (${username}). Don't capture the information for any other users, or any users ${name} is talking to.
Avoid specific biased domains, for example politics, religion, or other broadly divisive topics.

Make sure to ignore any information from other users and focus exclusively on analyzing the data created by ${name}.
`

  const { output } = await generateWithAI({
    system: systemPrompt,
    messages: [
      {
        type: 'text',
        text: `Please generate a detailed role-play agent profile for ${name} (${username}) based on the tweets provided.`,
      },
    ],
  })

  return {
    name: extract(output, 'name'),
    description: extract(output, 'description'),
    personality: extract(output, 'personality'),
    instruction: extract(output, 'instruction'),
  }
}
