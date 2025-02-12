import { Context, Task } from '../types'
import { TwitterAction } from '../actions/TwitterAction'
import { getTweetById } from '../../utils/agent/twitter/getTweetById'
import { prisma } from '@repo/db'
import { generateWithAI } from '../../utils/ai/generateWithAI'
import { extract } from '../../queue/bot/extract'
import { buildReplyTwitterPrompt } from '../../utils/agent/prompt/buildReplyTwitterPrompt'
import { UserMessage } from '../../utils/types'
import { purifyMessage } from '../../utils/common'

export class ReplyTwitterTask extends Task {
  async buildActions(context: Context) {
    const { agent, workspace, artifact } = context
    const { twitterIdToReply, twitterIdToQuote } = workspace
    const twitterId = twitterIdToReply ?? twitterIdToQuote
    if (!twitterId) {
      return
    }

    const { tweet, quoted } = await getTweetById(agent.id, twitterId)

    if (!agent.twitterUsername) {
      throw new Error('Invalid twitter data')
    }

    if (tweet.text.length < 1 && tweet.imageUrls.length < 1 && quoted.length < 1) {
      throw new Error(`Tweet is too short: ${tweet.text}`)
    }

    // build user profiles
    const userIds = [tweet.authorId, ...quoted.map((q) => q.authorId)].filter((id): id is string => id !== undefined)
    const twitterUsers = await prisma.twitterUser.findMany({
      where: { id: { in: [...new Set(userIds)] } },
    })
    const userProfiles = twitterUsers.map((i) =>
      `
<user_profile>
@${i.username} (${i.name}): ${i.description}
</user_profile>
`.trim(),
    )

    const quotedTexts = quoted.map((q) =>
      `
<posts_reference>
@${q.authorUsername} (${q.authorName}) : ${q.text}
</posts_reference>
`.trim(),
    )

    const userMessage = `
<user_profiles>
${userProfiles.join('\n')}
</user_profiles>
<posts_references>
${quotedTexts.join('\n')}
</posts_references>
<post_to_reply>
@${tweet.authorUsername} (${tweet.authorName}) : ${tweet.text}
</post_to_reply>`.trim()

    const systemPrompt = await buildReplyTwitterPrompt(agent)
    const messages: UserMessage[] = [{ type: 'text', text: userMessage }]
    // build images
    for (const url of tweet.imageUrls) {
      messages.push({ type: 'image', image: url })
    }
    workspace.messages = messages

    // pre plugins
    await context.executePrePlugins()

    const tools = await context.getTools()
    const { output, logId } = await generateWithAI({
      agent,
      scenario: 'twitter',
      system: systemPrompt,
      messages,
      tools,
    })

    const responseContent = extract(output, 'reply_content')

    if (!responseContent) {
      await prisma.inferenceLog.update({ where: { id: logId }, data: { isFailed: true } })
      return
    }

    const text = purifyMessage(responseContent)
    artifact.output.text = text

    // post plugins
    await context.executePostPlugins()

    if (twitterIdToReply) {
      return [
        new TwitterAction({
          action: 'reply',
          text,
          imageBuffer: artifact.output.imageBuffer,
          replyTweetId: twitterIdToReply,
        }),
      ]
    }

    if (twitterIdToQuote) {
      return [
        new TwitterAction({
          action: 'quote',
          text,
          imageBuffer: artifact.output.imageBuffer,
          quoteTweetId: twitterIdToQuote,
        }),
      ]
    }
  }
}
