import { prisma } from '@repo/db'
import { Agent } from '@prisma/client'
import { TwitterApi } from 'twitter-api-v2'

export async function refreshAccessToken({
  agentId,
  twitterRefreshToken,
}: {
  agentId: string
  twitterRefreshToken: string
}) {
  let agent = await prisma.agent.findUnique({ where: { id: agentId } })
  if (!agent) {
    throw new Error('Invalid agent id')
  }

  const twitterApi = new TwitterApi()
  const { accessToken, refreshToken } = await twitterApi.refreshOAuth2Token(twitterRefreshToken)
  console.info(`Refresh Twitter access token successfully for agent ${agentId}`)

  agent = await prisma.agent.update({
    where: { id: agentId },
    data: refreshToken
      ? { twitterAccessToken: accessToken, twitterRefreshToken: refreshToken }
      : { twitterAccessToken: accessToken },
  })

  return { agent }
}

export async function getTwitterUserId(agent: Agent) {
  if (agent.twitterUserId) {
    return agent.twitterUserId
  }

  if (!agent.twitterAccessToken) {
    return null
  }

  const twitterApi = new TwitterApi(agent.twitterAccessToken)
  const { data } = await twitterApi.v2.me()
  const twitterUserId = data?.id

  if (!twitterUserId) {
    return null
  }

  await prisma.agent.update({
    where: { id: agent.id },
    data: { twitterUserId },
  })

  return twitterUserId
}
