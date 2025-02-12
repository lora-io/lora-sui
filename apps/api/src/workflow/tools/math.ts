import { tool } from 'ai'
import * as mathjs from 'mathjs'
import { z } from 'zod'

export const math = tool({
  description: `A tool for evaluating mathematical expressions. Example expressions: '1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.`,
  parameters: z.object({ expression: z.string() }),
  execute: async ({ expression }) => {
    try {
      return mathjs.evaluate(expression)
    } catch (error) {
      console.error(`Tool math error:`, error)
      return {}
    }
  },
})
