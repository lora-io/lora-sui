import { RedisTools } from '../../utils/redis'
import { z } from 'zod'
import { tool } from 'ai'
import { AgentTool } from '@prisma/client'
import axios from 'axios'
import { ALL_TOOLS, ALL_TOOLS_NAMES } from './index'

export function buildTool(agentTool: AgentTool) {
  // return system tools
  for (const toolName of ALL_TOOLS_NAMES) {
    if (toolName === agentTool.name) {
      return ALL_TOOLS[toolName]
    }
  }

  // build custom tool
  const params: Record<string, z.ZodType> = {}
  const inputParams = JSON.parse(agentTool.parameters ?? '[]') as [string, string, string][]
  for (const [name, type, description] of inputParams) {
    switch (type.toLowerCase().trim()) {
      case 'string': {
        params[name.trim()] = z.string().describe(description.trim())
        break
      }
      case 'number': {
        params[name.trim()] = z.number().describe(description.trim())
        break
      }
    }
  }

  const { name, description, method, headers, requestBody, responsePath } = agentTool
  const parameters = z.object(params)

  return tool({
    description,
    parameters,
    execute: async (input: z.infer<typeof parameters>, { toolCallId }) => {
      const urlObj = new URL(agentTool.url)
      for (const key in input) {
        urlObj.searchParams.append(key, input[key])
      }

      const url = urlObj.toString()
      try {
        let data = await RedisTools.getToolCache(url)
        if (data) {
          console.info(`Tool ${name} output of ${url}: from redis cache`)
        } else {
          console.info(`Tool ${name} start get data from ${url}`)
          const { data: rawData } = await axios({
            url,
            method,
            headers: headers ? JSON.parse(headers) : {},
            data: requestBody ? JSON.parse(requestBody) : {},
          })
          if (rawData) {
            data = JSON.stringify(rawData)
            await RedisTools.saveToolCache(url, data, 300)
            console.info(`Tool ${name} output of ${url}: from api`)
          } else {
            console.info(`Tool ${name} output of ${url}: not found`)
          }
        }

        const json = data ? JSON.parse(data) : null
        let result = json ?? {}
        const outputKeys = responsePath ? responsePath.split('.') : []
        for (const key of outputKeys) {
          result = result?.[key]
        }
        result = result ?? {}
        return result
      } catch (error: any) {
        console.error(`Tool ${name} error:`, error)
        return {}
      }
    },
  })
}
