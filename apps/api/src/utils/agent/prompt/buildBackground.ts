import dayjs from 'dayjs'
import { Agent } from '@prisma/client'

export async function buildBackground(agent: Agent, scene: 'telegram' | 'discord') {
  const currentTime = dayjs()

  const { twitterUsername, botUsername, botFirstName, discordId, discordDisplayName } = agent

  let texts = [`The current time is: ${currentTime.format('MMMM D, YYYY, h:mm A')}.`]

  if (scene === 'telegram') {
    texts.push(
      `You're chatting with some folks in a telegram group chat. Your username is @${botUsername} and your first name is ${botFirstName}.`,
    )
  }

  if (scene === 'discord') {
    texts.push(
      `You're chatting with some folks in a discord group chat. Your id is @${discordId} and your name is ${discordDisplayName}.`,
    )
  }

  if (twitterUsername) {
    texts.push(`Your Twitter username is ${twitterUsername}.`)
    texts.push(`If someone asks you to post on Twitter, refuse humorously. You only post when you find it interesting.`)
  }

  return texts.map((i) => i.trim()).join(' ')
}
