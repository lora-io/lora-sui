import { tool } from 'ai'
import { z } from 'zod'
import axios from 'axios'

export const fetch = tool({
  description: `A tool for fetching data of a given URL.`,
  parameters: z.object({ url: z.string() }),
  execute: async ({ url }) => {
    try {
      const { data } = await axios.get(url)
      return data
    } catch (error) {
      console.error(`Tool fetch error:`, error)
      return {}
    }
  },
})
