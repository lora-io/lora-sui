import { IS_PRODUCTION } from '../../constants'
import { TwitterApi } from 'twitter-api-v2'
import { prisma } from '@repo/db'
import { reportError } from '../../common'
import { refreshAccessToken } from './common'
import { TwitterPost } from '@prisma/client'

export async function postTwitterMessage(
  {
    agentId,
    content,
    quoteTweetId,
    replyTweetId,
    imageBuffer,
    inChat = false,
  }: {
    agentId: string
    content: string
    imageBuffer?: Buffer | null
    quoteTweetId?: string
    replyTweetId?: string
    inChat?: boolean
  },
  isRetry: boolean = false,
) {
  if (!IS_PRODUCTION) {
    console.info(`Skipping Twitter post: ${content}`)
    return 'https://x.com/fake_post_never_show'
  }
  const agent = await prisma.agent.findUnique({ where: { id: agentId } })
  const { twitterAccessToken, twitterRefreshToken, twitterUsername } = agent ?? {}
  if (!twitterAccessToken || !twitterRefreshToken) {
    return null
  }

  let twitterPost: TwitterPost | null = null
  if (replyTweetId) {
    twitterPost = await prisma.twitterPost.findUnique({
      where: { agentId_replyTweetId: { agentId, replyTweetId } },
    })
  } else if (quoteTweetId) {
    twitterPost = await prisma.twitterPost.findUnique({
      where: { agentId_quoteTweetId: { agentId, quoteTweetId } },
    })
  }
  if (!twitterPost) {
    const id = Date.now().toString() + Math.random().toString().slice(2, 5)
    twitterPost = await prisma.twitterPost.create({
      data: { id, agentId, text: content, quoteTweetId, replyTweetId, status: 0, inChat },
    })
  }

  if (twitterPost.status === 1 && twitterPost.tweetId) {
    console.info('Twitter post already sent, skip')
    return `https://x.com/${twitterUsername}/status/${twitterPost.tweetId}`
  }

  let mediaId: string | null = null
  if (imageBuffer && agent) {
    mediaId = await uploadMedia(imageBuffer, agent.twitterUserId)
  }

  console.info(`Tweet for agent ${agentId}, isRetry: ${isRetry}, mediaId:${mediaId}, token: ${twitterAccessToken}`)
  try {
    const result = await new TwitterApi(twitterAccessToken).v2.tweet(content, {
      quote_tweet_id: quoteTweetId ? quoteTweetId : undefined,
      reply: replyTweetId ? { in_reply_to_tweet_id: replyTweetId } : undefined,
      media: mediaId ? { media_ids: [mediaId] } : undefined,
    })
    const tweetId = result.data.id
    await prisma.$transaction([
      prisma.twitterPost.update({
        where: { id: twitterPost.id },
        data: { tweetId, status: 1 },
      }),
      prisma.agent.update({
        where: { id: agentId },
        data: { credits: { decrement: 1 }, creditsUsed: { increment: 1 } },
      }),
    ])
    return `https://x.com/${twitterUsername}/status/${result.data.id}`
  } catch (error: any) {
    if (!isRetry) {
      await refreshAccessToken({ agentId, twitterRefreshToken })
      return postTwitterMessage({ agentId, content, quoteTweetId, replyTweetId, imageBuffer }, true)
    }
    console.error(
      `Failed to post twitter @${twitterUsername}: ${error.data?.detail ?? error.message}. Data: ${JSON.stringify(error.data?.errors)}`,
    )
    if (error.code !== 429 && error.code !== 403) {
      reportError(new Error(`https://x.com/${twitterUsername} | Failed to post: ${error.code} - ${error.message}`))
    }
    throw error
  }
}

async function uploadMedia(imageBuffer: Buffer, twitterUserId: string | null | undefined): Promise<string | null> {
  if (!twitterUserId) {
    return null
  }
  try {
    const clientv1 = new TwitterApi()

    return await clientv1.v1.uploadMedia(imageBuffer, {
      mimeType: 'image/png',
      additionalOwners: twitterUserId,
    })
  } catch (error: any) {
    console.error(`Failed to upload media: ${error.message}`)
    reportError(new Error(`Failed to upload media: ${error.message}`))
    return null
  }
}
