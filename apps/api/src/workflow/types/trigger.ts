import { Agent } from '@prisma/client'

export enum TriggerType {
  TelegramMessage = 'TelegramMessage',
  DiscordMessage = 'DiscordMessage',
  TwitterReply = 'TwitterReply',
}

export interface AgentTriggerPayload {
  agent: Agent
}

export interface MessageTriggerPayload extends AgentTriggerPayload {
  messageId: string
}

export interface TwitterTriggerPayload extends AgentTriggerPayload {
  action: 'reply' | 'quote'
  twitterId: string
  messageId: string
}

export type TriggerConfig =
  | {
      type: TriggerType.TelegramMessage | TriggerType.DiscordMessage
      payload: MessageTriggerPayload
    }
  | {
      type: TriggerType.TwitterReply
      payload: TwitterTriggerPayload
    }
