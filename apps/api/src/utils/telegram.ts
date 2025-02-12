import { MyContext } from '../queue/types'
import { purifyMessage, reportError, sleep } from './common'
import { Context, Telegraf } from 'telegraf'
import { UserFromGetMe } from '@telegraf/types'
import he from 'he'
import Telegram from 'telegraf/typings/telegram'
import { HTTP } from './http'

export function isValidTelegramLink(link: string) {
  return link.startsWith('https://') && (link.includes('t.me') || link.includes('telegram.me'))
}

export function isValidTwitterLink(link: string) {
  return link.startsWith('https://') && link.includes('x.com')
}

export async function tryGetTelegramGroupTitle(url: string) {
  if (!isValidTelegramLink(url)) {
    return null
  }

  try {
    const { data } = await HTTP.get<string>(url)
    const title = data.match(/<meta property="og:title" content="(.+?)">/)
    return title ? he.decode(title[1]) : null
  } catch (e) {
    console.error('tryGetTelegramGroupTitle', e)
    return null
  }
}

export async function getBotInfoWithRetry(bot: Telegraf<MyContext>, retryCount = 0): Promise<UserFromGetMe> {
  try {
    return await bot.telegram.getMe()
  } catch (error) {
    if (retryCount < 3) {
      console.error(`Failed to get bot info: ${error}, retrying...`)
      await sleep(1000)
      return getBotInfoWithRetry(bot, retryCount + 1)
    }
    throw error
  }
}

export async function isTelegramGroupAdmin(ctx: Context): Promise<boolean> {
  try {
    if (!ctx.chat?.id || !ctx.from?.id) return false

    const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id)
    return ['creator', 'administrator'].includes(member.status)
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

export async function sendTelegramMessage({
  telegram,
  chatId,
  threadId,
  replyToMessageId,
  responseContent,
  imageBuffer,
  isRetry = false,
}: {
  telegram: Telegram
  chatId: number | string
  threadId?: number
  replyToMessageId?: number
  responseContent: string
  imageBuffer?: Buffer | null
  isRetry?: boolean
}): Promise<number | undefined> {
  const content = purifyMessage(responseContent)
  const parse_mode = !isRetry && isTelegramHtmlFormat(content) ? 'HTML' : undefined
  const reply_parameters = replyToMessageId
    ? { message_id: replyToMessageId, allow_sending_without_reply: false }
    : undefined

  try {
    const message = imageBuffer
      ? await telegram.sendPhoto(
          chatId,
          {
            source: imageBuffer,
            filename: 'image.png',
          },
          {
            caption: content,
            parse_mode,
            reply_parameters,
            message_thread_id: threadId,
          },
        )
      : await telegram.sendMessage(chatId, content, {
          parse_mode,
          reply_parameters,
          message_thread_id: threadId,
        })
    return message.message_id
  } catch (error: any) {
    const message = error.message?.toLowerCase() ?? ''
    if (
      message.includes('unauthorized') ||
      message.includes('not found') ||
      message.includes('forbidden') ||
      message.includes('bad request')
    ) {
      return
    }

    if (!isRetry) {
      await sleep(5000)
      return sendTelegramMessage({
        telegram,
        chatId,
        replyToMessageId,
        responseContent,
        isRetry: true,
      })
    }

    reportError(error)
    throw error
  }
}

function isTelegramHtmlFormat(text: string): boolean {
  return /<(b|strong|i|em|u|ins|s|strike|del|span|tg-spoiler|code|pre|a|tg-emoji|blockquote)>[\s\S]*?<\/\1>/.test(text)
}

export function shouldReplyMessage(ctx: MyContext) {
  if (!ctx.message) {
    return {
      isReplyToMe: false,
      isMentionToMe: false,
      shouldReply: false,
    }
  }
  const botUsername = ctx.me
  const isReplyToMe = 'reply_to_message' in ctx.message && ctx.message.reply_to_message?.from?.username === botUsername
  const messageText = 'text' in ctx.message ? ctx.message.text : 'caption' in ctx.message ? ctx.message.caption : ''
  const isMentionToMe = (messageText ?? '').includes(botUsername)
  return {
    isReplyToMe,
    isMentionToMe,
    shouldReply: isReplyToMe || isMentionToMe,
  }
}
