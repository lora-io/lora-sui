import { Action, Context, TwitterActionPayload } from '../types'
import { postTwitterMessage } from '../../utils/agent/twitter/postTwitterMessage'

export class TwitterAction extends Action {
  readonly payload: TwitterActionPayload

  constructor(payload: TwitterActionPayload) {
    super()
    this.payload = payload
  }

  async execute({ agent, artifact }: Context) {
    const { text, imageBuffer, action } = this.payload

    let inChat = false
    let replyTweetId: string | undefined
    let quoteTweetId: string | undefined

    switch (action) {
      case 'post':
        inChat = this.payload.inChat
        break
      case 'reply':
        replyTweetId = this.payload.replyTweetId
        break
      case 'quote':
        quoteTweetId = this.payload.quoteTweetId
        break
    }

    // post twitter
    try {
      const link = await postTwitterMessage({
        agentId: agent.id,
        content: text,
        imageBuffer,
        inChat,
        replyTweetId,
        quoteTweetId,
      })

      if (link) {
        artifact.twitter = {
          action,
          link,
          result: {
            text,
            imageBuffer,
          },
        }
      }
    } catch (error) {
      console.error('post twitter failed:', error)
    }
  }
}
