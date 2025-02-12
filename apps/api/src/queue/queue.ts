import Queue, { QueueOptions } from 'bull'
import { REDIS_HOST, REDIS_PORT } from '../utils/constants'
import {
  BotQueuePayload,
  EmptyQueuePayload,
  ManualQueuePayload,
  MessageQueuePayload,
  SummaryQueuePayload,
} from './types'

export const queueOptions: QueueOptions = {
  redis: { port: REDIS_PORT, host: REDIS_HOST, db: 1 },
  prefix: 'lora',
}

export const manualQueue = new Queue<ManualQueuePayload>('manual', queueOptions)
export const cacheQueue = new Queue<EmptyQueuePayload>('cache', queueOptions)

export const telegramBotQueue = new Queue<BotQueuePayload>('telegram-bot', queueOptions)
export const discordBotQueue = new Queue<BotQueuePayload>('discord-bot', queueOptions)
export const messageSummaryQueue = new Queue<SummaryQueuePayload>('message-summary', queueOptions)
export const telegramMessageQueue = new Queue<MessageQueuePayload>('telegram-message', queueOptions)
export const discordMessageQueue = new Queue<MessageQueuePayload>('discord-message', queueOptions)

export const ALL_QUEUES = [
  telegramBotQueue,
  discordBotQueue,
  messageSummaryQueue,
  telegramMessageQueue,
  discordMessageQueue,
  manualQueue,
  cacheQueue,
]
