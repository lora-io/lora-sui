import { prisma } from '@repo/db'
import { getImageFormatFromUrl, sleep } from '../common'
import { generateText, ImagePart, TextPart, Tool } from 'ai'
import { Agent } from '@prisma/client'
import { UserMessage } from '../types'
import { generateWithAtoma } from './generateWithAtoma'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const modelId = 'openai/gpt-4o'
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_KEY,
})

export async function generateWithAI({
  agent,
  system,
  messages,
  scenario,
  isRetry = false,
  tools = {},
}: {
  agent?: Agent
  system: string
  messages: Array<UserMessage>
  tools?: Record<string, Tool>
  scenario?: 'telegram' | 'discord' | 'twitter'
  isRetry?: boolean
}) {
  const imageMessages: ImagePart[] = messages.filter((i) => i.type === 'image') as ImagePart[]
  const imageUrls = imageMessages.map((i) => (typeof i.image === 'string' ? i.image : 'buffer')).join(', ')
  console.info(
    `[${agent?.id}] start inference`,
    JSON.stringify({
      retry: isRetry,
      tools: Object.keys(tools),
      images: imageUrls,
    }),
  )

  // reformat messages
  const content: Array<TextPart | ImagePart> = []
  for (const message of messages) {
    switch (message.type) {
      case 'image': {
        if (typeof message.image === 'string') {
          const format = getImageFormatFromUrl(message.image)
          console.log(`message image format: ${format}`)
          if (format) {
            content.push({
              type: 'image',
              image: new URL(message.image),
              mimeType: `image/${format}`,
            })
          }
        } else {
          content.push({
            type: 'image',
            image: message.image,
          })
        }
        break
      }
      case 'text': {
        content.push({
          type: 'text',
          text: message.text.trim(),
        })
        break
      }
      default:
        break
    }
  }

  // handle atoma cloud
  if (agent?.cloudProvider === 'atoma') {
    return generateWithAtoma({
      agent,
      system,
      messages: messages.map((i) => (i.type === 'text' ? i.text : '')),
    })
  }

  try {
    const { usage, finishReason, response, steps } = await generateText({
      model: openrouter(modelId),
      tools,
      maxSteps: 5,
      system,
      messages: [{ role: 'user', content }],
    })

    // store tool results
    const allToolCalls = steps.flatMap((step) => step.toolResults) as {
      toolCallId: string
      toolName: string
      args: object
      result: any
    }[]
    for (const call of allToolCalls) {
      await prisma.agentToolLog.create({
        data: {
          agentTool: { connect: { name: call.toolName } },
          toolCallId: call.toolCallId,
          input: JSON.stringify(call.args),
          output: JSON.stringify(call.result),
        },
      })
    }

    // build response
    let imageBuffer: Buffer | null = null

    const input = messages.map((i) => ({
      type: i.type,
      ...(i.type === 'text' ? { text: i.text } : {}),
    }))

    let output = ''
    for (const message of response.messages.filter((i) => i.role === 'assistant')) {
      for (const part of message.content) {
        if (typeof part === 'string') {
          output += part
        } else if (part.type === 'text') {
          output += part.text
        }
      }
    }

    const log = await prisma.inferenceLog.create({
      data: {
        agentId: agent?.id,
        system,
        input: JSON.stringify(input, null, 2),
        output,
        stopReason: finishReason,
        inputTokens: usage.promptTokens,
        outputTokens: usage.completionTokens,
        modelId,
        scenario,
      },
    })

    return { output, imageBuffer, logId: log.id }
  } catch (error: any) {
    if (isRetry || error.$fault === 'client') {
      console.error(`generate failed. $fault: ${error.$fault}, : ${error.message}`)
      throw error
    }

    await sleep(5_000)
    console.error('generate failed:', error)
    return generateWithAI({ agent, system, messages, isRetry: true, tools })
  }
}
