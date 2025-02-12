import { Context, Telegraf } from 'telegraf'

// queue types
export interface EmptyQueuePayload {}

export interface ManualQueuePayload {
  task: string
}

export interface DepositQueuePayload {
  signature: string
}

export interface MessageQueuePayload {
  agentId: string
  messageId: string
}

export interface ReplyTwitterQueuePayload {
  action: 'quote' | 'reply'
  twitterLink: string
  agentId: string
  messageId: string
  retry?: number
}

export interface AgentAutomationQueuePayload {
  agentId: string
}

export interface TokenQueuePayload {
  contractAddress: string
}

export interface SummaryQueuePayload {
  groupId: string
}

export interface BotQueuePayload {
  botToken: string
  action: 'add' | 'remove' | 'update'
}

export interface ScheduleQueuePayload {
  scheduleId: number
}

// bot types
export type MyBot = Telegraf<MyContext>

export interface MyContext extends Context {}
