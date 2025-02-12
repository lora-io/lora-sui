import { ReferencedTweetV2, Tweetv2FieldsParams, TwitterApi } from 'twitter-api-v2'
import { reportError } from '../../common'
import { refreshAccessToken } from './common'
import { prisma } from '@repo/db'
import { trimLinks } from '../../twitter'

const tweetFieldsParams: Partial<Tweetv2FieldsParams> = {
  expansions: ['author_id', 'attachments.media_keys', 'referenced_tweets.id', 'entities.mentions.username'],
  'tweet.fields': ['created_at', 'text', 'entities', 'attachments'],
  'user.fields': ['name', 'username', 'description', 'location'],
  'media.fields': ['url', 'type'],
}

export async function getTweetById(agentId: string, tweetId: string, isRetry: boolean = false) {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } })
  const { twitterAccessToken, twitterRefreshToken } = agent ?? {}
  if (!twitterAccessToken || !twitterRefreshToken) {
    throw new Error('Agent does not have Twitter access')
  }

  let tweet: Awaited<ReturnType<TwitterApi['v2']['singleTweet']>> | null = null
  console.info(`Get tweet ${tweetId} for agent ${agentId}, isRetry: ${isRetry}, token: ${twitterAccessToken}`)
  const client = new TwitterApi(twitterAccessToken)

  try {
    tweet = await client.v2.singleTweet(tweetId, tweetFieldsParams)
  } catch (error: any) {
    console.error(error)
    if (error.code === 404 || error.message?.includes('not found')) {
      throw error
    }
    if (!isRetry) {
      await refreshAccessToken({ agentId, twitterRefreshToken })
      return getTweetById(agentId, tweetId, true)
    }
    if (error.code !== 429 && error.code !== 403) {
      reportError(
        new Error(
          `Failed to get tweet by ID ${tweetId} for agent https://x.com/${agent?.twitterUsername}: ${error.message}`,
        ),
      )
    }
    throw error
  }

  if (!tweet?.data) {
    throw new Error('Tweet not found')
  }
  const users = tweet.includes?.users ?? []
  const authorId = tweet.data.author_id
  const author = users.find((u) => u.id === authorId)
  const quotedTweets = tweet.includes?.tweets ?? []
  const imageUrls: string[] = []
  for (const media of tweet.includes?.media ?? []) {
    if (media.type === 'photo' && media.url) {
      imageUrls.push(media.url)
    }
  }

  for (const quotedTweet of quotedTweets) {
    const quotedMediaKeys = quotedTweet.attachments?.media_keys?.length ?? 0
    if (quotedMediaKeys > 0) {
      const tweet = await client.v2.singleTweet(quotedTweet.id, tweetFieldsParams)
      for (const media of tweet.includes?.media ?? []) {
        if (media.type === 'photo' && media.url) {
          imageUrls.push(media.url)
        }
      }
    }
  }

  if (quotedTweets.length > 0 && quotedTweets[0].referenced_tweets && quotedTweets[0].referenced_tweets.length > 0) {
    let lastTweet: ReferencedTweetV2 | undefined = quotedTweets[0].referenced_tweets[0]
    while (lastTweet && quotedTweets.length < 5) {
      const tweet = await client.v2.singleTweet(lastTweet.id, tweetFieldsParams)
      for (const media of tweet.includes?.media ?? []) {
        if (media.type === 'photo' && media.url) {
          imageUrls.push(media.url)
        }
      }
      quotedTweets.unshift(tweet.data)
      lastTweet = tweet?.data?.referenced_tweets?.[0]
    }
  }

  for (const user of users) {
    await prisma.twitterUser.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        username: user.username,
        description: user.description,
        location: user.location,
      },
      create: {
        id: user.id,
        name: user.name,
        username: user.username,
        description: user.description,
        location: user.location,
      },
    })
  }

  return {
    tweet: {
      text: trimLinks(tweet.data.text),
      authorId: authorId,
      authorName: author?.name,
      authorUsername: author?.username,
      imageUrls: imageUrls.map(getOrigImageUrl),
    },
    quoted: quotedTweets
      .filter((i) => !!i)
      .map((i) => ({
        createdAt: i.created_at,
        text: i.text,
        authorId: i.author_id,
        authorName: users.find((u) => u.id === i.author_id)?.name,
        authorUsername: users.find((u) => u.id === i.author_id)?.username,
      })),
  }
}

function getOrigImageUrl(urlString: string) {
  const url = new URL(urlString)
  const search = new URLSearchParams(url.search)
  search.set('name', 'orig')
  url.search = search.toString()
  return url.toString()
}
