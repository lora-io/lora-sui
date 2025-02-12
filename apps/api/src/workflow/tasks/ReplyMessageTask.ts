import { Action, Context, MessageActionPayload, Task } from '../types'
import { TelegramAction } from '../actions/TelegramAction'
import { TwitterAction } from '../actions/TwitterAction'
import { purifyMessage } from '../../utils/common'
import { DiscordAction } from '../actions/DiscordAction'
import { ImagePart, TextPart } from 'ai'
import { prisma } from '@repo/db'
import { buildMessagePrompt } from '../../utils/agent/prompt/buildMessagePrompt'
import { generateWithAI } from '../../utils/ai/generateWithAI'
import { extract } from '../../queue/bot/extract'
import { Message } from '@prisma/client'

export class ReplyMessageTask extends Task {
  async buildActions(context: Context) {
    const { agent, workspace, artifact } = context
    const { messageToReply } = workspace
    if (!messageToReply) {
      return
    }
    const { groupId, threadId, telegramUserId, discordUserId, text: message, imageUrl, quoteMessageId } = messageToReply

    // load quoted message
    let quoteMessage: Message | null = null
    if (quoteMessageId) {
      quoteMessage = await prisma.message.findUnique({ where: { id: quoteMessageId } })
    }

    // build user messages
    const userMessage = quoteMessage
      ? `
<quoted_message>
${quoteMessage.text}
</quoted_message>
<user_message>
${message}
</user_message>
`
      : `
<user_message>
${message}
</user_message>
`
    let responseContent: string | null = null
    let twitterContent: string | null = null
    let output: string | null = null

    // build user prompt
    const messages: Array<TextPart | ImagePart> = [{ type: 'text', text: userMessage }]
    if (imageUrl) {
      messages.push({ type: 'image', image: imageUrl })
    } else if (quoteMessage && quoteMessage.imageUrl) {
      messages.push({ type: 'image', image: quoteMessage.imageUrl })
    }
    workspace.messages = messages

    // pre plugins
    await context.executePrePlugins()

    // start inference
    const systemPrompt = await buildMessagePrompt({
      groupId,
      discordUserId,
      telegramUserId,
      agent,
      isUncensored: false,
      message,
    })
    const tools = await context.getTools()
    const result = await generateWithAI({
      scenario: discordUserId ? 'discord' : 'telegram',
      agent,
      system: systemPrompt,
      messages,
      tools,
    })

    // parse response content
    output = result.output
    responseContent = extract(output, 'response_content', true)
    twitterContent = extract(output, 'twitter_content')
    if (!responseContent) {
      await prisma.inferenceLog.update({ where: { id: result.logId }, data: { isFailed: true } })
    }

    if (!responseContent) {
      return
    }

    const text = purifyMessage(responseContent)
    artifact.output.text = text

    // post plugins: generate oracle image
    await context.executePostPlugins()

    // update agent credits
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        credits: { decrement: 1 },
        creditsUsed: { increment: 1 },
      },
    })

    // build actions
    const actions: Action[] = []

    if (twitterContent) {
      actions.push(
        new TwitterAction({
          action: 'post',
          text: purifyMessage(twitterContent),
          imageBuffer: artifact.output.imageBuffer,
          inChat: true,
        }),
      )
    }

    const payloadMessage: MessageActionPayload['message'] = {
      groupId,
      threadId,
      loraMessageId: messageToReply.id,
      originMessageId: messageToReply.messageId,
    }

    if (telegramUserId) {
      actions.push(
        new TelegramAction({
          message: payloadMessage,
          text,
          imageBuffer: artifact.output.imageBuffer,
        }),
      )
    }

    if (discordUserId) {
      actions.push(
        new DiscordAction({
          message: payloadMessage,
          text,
          imageBuffer: artifact.output.imageBuffer,
        }),
      )
    }

    return actions
  }
}
