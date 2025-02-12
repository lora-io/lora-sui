import { prisma } from '@repo/db'
import { Agent } from '@prisma/client'
import axios from 'axios'
import { Readable } from 'stream' // Import Readable for streaming response

const modelId = 'meta-llama/Llama-3.3-70B-Instruct'

export async function generateWithAtoma({
  agent,
  system,
  messages,
  scenario,
}: {
  agent?: Agent
  system: string
  messages: Array<string>
  scenario?: 'telegram' | 'discord' | 'twitter'
}) {
  console.info(`[${agent?.id}] start inference`)

  const completionMessages: ChatCompletionMessage[] = [
    { role: 'system', content: system },
    ...messages.map((message) => ({
      role: 'user',
      content: message,
    })),
  ] as ChatCompletionMessage[]
  const output = await getChatCompletion(completionMessages)

  const log = await prisma.inferenceLog.create({
    data: {
      agentId: agent?.id,
      system,
      input: JSON.stringify(messages, null, 2),
      output,
      stopReason: '',
      inputTokens: 0,
      outputTokens: 0,
      modelId,
      scenario,
    },
  })

  return { output, imageBuffer: null, logId: log.id }
}

interface ChatCompletionMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatCompletionRequest {
  stream: boolean
  model: string
  messages: ChatCompletionMessage[]
  max_tokens: number
}

interface ChatCompletionResponseChunk {
  id: string
  object: string
  created: number
  model: string
  choices: [
    {
      delta: {
        content?: string
      }
      index: number
      finish_reason: string | null
    },
  ]
}

async function getChatCompletion(messages: ChatCompletionMessage[]): Promise<string> {
  const data: ChatCompletionRequest = {
    stream: true,
    model: 'meta-llama/Llama-3.3-70B-Instruct',
    messages,
    max_tokens: 128,
  }

  const response = await axios.post('https://api.atoma.network/v1/chat/completions', data, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.ATOMA_KEY}`,
    },
    responseType: 'stream',
  })

  const stream: Readable = response.data
  let fullResponse = ''
  if (!stream) {
    throw new Error('Stream is null or undefined.')
  }

  return new Promise<string>((resolve, reject) => {
    stream.on('data', (chunk) => {
      const chunkString = chunk.toString()
      const lines = chunkString.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonString = line.substring(6).trim()
          if (jsonString === '[DONE]') {
            resolve(fullResponse)
            return
          }

          try {
            const json: ChatCompletionResponseChunk = JSON.parse(jsonString)
            if (json.choices && json.choices.length > 0 && json.choices[0].delta && json.choices[0].delta.content) {
              fullResponse += json.choices[0].delta.content
            }
          } catch (parseError) {
            console.error('Error parsing JSON:', parseError)
            console.error('Problematic JSON:', jsonString)
            reject(parseError)
            stream.destroy()
            return
          }
        } else if (line.startsWith('error: ')) {
          const errorMessage = line.substring(7).trim()
          console.error('Error from API:', errorMessage)
          reject(new Error(errorMessage))
          stream.destroy()
          return
        }
      }
    })

    stream.on('end', () => {
      resolve(fullResponse)
    })

    stream.on('error', (error) => {
      console.error('Stream error:', error)
      reject(error)
    })
  })
}
