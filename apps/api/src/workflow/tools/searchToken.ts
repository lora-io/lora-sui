import { tool } from 'ai'
import { z } from 'zod'

interface SearchTokenInfo {
  symbol: string
  name: string
  coinType: string
  mc: number
}

export const searchToken = tool({
  description: `A tool to search for a token by symbol on the SUI network. The symbol entered by the user may start with a $, and the name when calling the tool should be a pure alphanumeric combination. The api will response with the symbol, name, objectId, and marketCap of the token.`,
  parameters: z.object({ symbol: z.string() }),
  execute: async ({ symbol }) => {
    const url = `https://api-ex.insidex.trade/search/coin/${symbol.replace('$', '')}`
    const headers = {
      'x-api-key': process.env.INSIDEX_KEY ?? '',
    }
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        return {}
      }

      const data = (await response.json()) as SearchTokenInfo[]
      return data.map((row) => ({
        symbol: row.symbol,
        name: row.name,
        objectId: row.coinType,
        marketCap: row.mc,
      }))
    } catch (error) {
      console.error('Error fetching Twitter data:', error)
      return {}
    }
  },
})
