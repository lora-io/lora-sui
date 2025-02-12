import { Redis } from 'ioredis'
import { REDIS_HOST, REDIS_PORT } from './constants'

export const redis = new Redis({ host: REDIS_HOST, port: REDIS_PORT, keyPrefix: 'lora:' })

export enum RedisKeys {
  TwitterOAuth = 'oauth:twitter',
  ToolCache = 'cache:tool',
}

export interface TwitterAuth {
  url: string
  codeVerifier: string
  state: string
  agentId: string
}

export const RedisTools = {
  async saveTwitterAuth(state: string, data: TwitterAuth) {
    return redis.set(`${RedisKeys.TwitterOAuth}:${state}`, JSON.stringify(data), 'EX', 600)
  },

  async getTwitterAuth(state: string): Promise<TwitterAuth | undefined> {
    const data = await redis.get(`${RedisKeys.TwitterOAuth}:${state}`)
    if (!data) {
      return
    }
    return JSON.parse(data)
  },

  async saveToolCache(key: string, value: string, expire: number) {
    return redis.set(`${RedisKeys.ToolCache}:${key}`, value, 'EX', expire)
  },

  async getToolCache(key: string): Promise<string | null> {
    return redis.get(`${RedisKeys.ToolCache}:${key}`)
  },
}

export interface HomeCache {
  id: string
  name: string
  contractAddress: string | null
  description: string
  botUsername: string | null
  botAvatar: string | null
  tgGroupLink: string | null
  discordGroupLink: string | null
  twitterUsername: string | null
  createdAt: Date
  marketcap: number | null
  creditsUsed: number
  count: number
}
