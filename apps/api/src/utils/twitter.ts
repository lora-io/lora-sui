import { IS_PRODUCTION } from './constants'
import { prisma } from '@repo/db'
import { TweetV2 } from 'twitter-api-v2'

export const X_CALLBACK_ORIGIN = IS_PRODUCTION ? 'https://api.mylora.xyz' : 'http://localhost:5000'
export const X_CALLBACK_URL = X_CALLBACK_ORIGIN + '/twitter/callback'

export function trimLinks(text: string) {
  return text.replace(/https?:\/\/\S+/g, '').trim()
}

export const extractTwitterLink = (text: string): string | null => {
  const regex = /(https:\/\/x\.com\/\w+\/status\/\d+)/i
  const match = text.match(regex)
  return match ? match[1] : null
}

export const extractTweetId = (url: string) => {
  const regex = /(?:twitter|x)\.com\/\w+\/status\/(\d+)/i
  const match = url.match(regex)
  return match ? match[1] : null
}

export async function filterTweetsToReply(agentId: string, posts: TweetV2[]) {
  const postedPosts = await prisma.twitterPost.findMany({ where: { agentId } })
  const postedPostIds = new Set([
    ...postedPosts.map((post) => post.replyTweetId),
    ...postedPosts.map((post) => post.quoteTweetId),
  ])
  const postedAuthorids = new Set<string>()

  const filteredPosts: TweetV2[] = []
  for (const post of posts) {
    // skip posts that have already been replied to
    if (postedPostIds.has(post.id)) {
      continue
    }
    // skip short posts
    if (post.text.trim().length < 15) {
      continue
    }
    // skip retweet
    if (post.text.startsWith('RT @')) {
      continue
    }
    // check author id already exists in posts
    if (!post.author_id) {
      continue
    }
    if (postedAuthorids.has(post.author_id)) {
      continue
    }
    // add to posts
    filteredPosts.push(post)
    postedAuthorids.add(post.author_id)
  }

  return filteredPosts
}
