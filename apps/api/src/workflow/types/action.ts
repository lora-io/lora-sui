export interface ActionPayload {
  onComplete?: () => void
}

export type MessageActionPayload = ActionPayload & {
  message: {
    groupId: string
    threadId: string | null
    loraMessageId: string | null
    originMessageId: string | null
  }
  text: string
  imageBuffer?: Buffer | null
}

export type TwitterActionPayload = ActionPayload & {
  text: string
  imageBuffer?: Buffer | null
} & (
    | {
        action: 'post'
        inChat: boolean
      }
    | {
        action: 'reply'
        replyTweetId: string
      }
    | {
        action: 'quote'
        quoteTweetId: string
      }
  )
