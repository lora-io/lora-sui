import { tool } from 'ai'
import { z } from 'zod'
import dayjs from 'dayjs'

interface TwitterSuiResponse {
  meta: {
    end_time: string
    start_time: string
    total: number
    usernames: string[]
  }
  tweets: [string, string, string, string, string][]
}

export const twitterSui = tool({
  description: `A tool to obtain the latest sui-related information from Twitter.`,
  parameters: z.object({}),
  execute: async () => {
    const end = dayjs()
    const start = end.subtract(30, 'day')
    const end_time = end.format('YYYY-MM-DDTHH:mm:ss')
    const start_time = start.format('YYYY-MM-DDTHH:mm:ss')

    const url = 'https://api.openmind.org/api/v1/x/search'
    const headers = {
      'x-api-key': process.env.OPENMIND_API_KEY ?? '',
      'Content-Type': 'application/json',
    }
    const body = {
      usernames: ['emanabio', 'CleanwaterSui', 'SuiNetwork'],
      start_time,
      end_time,
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        return {}
      }

      const data = (await response.json()) as TwitterSuiResponse
      return data.tweets.map((row) => ({
        time: row[2],
        content: row[1],
      }))
    } catch (error) {
      console.error('Error fetching Twitter data:', error)
      return {}
    }
  },
})
