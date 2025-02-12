import { embed } from 'ai'

import { embeddingModel } from './config'
import { AgentAttachment, prisma } from '@repo/db'
import { chunkText } from './chunkText'
import { generateEmbeddings } from './generateEmbeddings'

export class VectorDB {
  async addText({ text, attachment }: { text: string; attachment: AgentAttachment }) {
    const chunks = chunkText(text)
    const embeddings = await generateEmbeddings(chunks)

    await prisma.$transaction(async (tx) => {
      for (const { content, embedding } of embeddings) {
        await tx.$executeRaw`
          INSERT INTO embeddings ("id", "content", "embedding", "agentAttachmentId", "agentId")
          VALUES (gen_random_uuid(),
                  ${content},
                  ${JSON.stringify(embedding)}::vector(1536),
                  ${attachment.id},
                  ${attachment.agentId})
        `
      }
    })
  }

  async searchSimilar({ agentId, searchQuery }: { agentId: string; searchQuery: string }): Promise<string> {
    if (searchQuery.length < 2) {
      return ''
    }
    const { embedding } = await embed({
      model: embeddingModel,
      value: searchQuery,
    })

    const vectorQuery = await prisma.$queryRaw`
      SELECT content, 1 - (embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
      FROM embeddings
      WHERE "agentId" = ${agentId}
      ORDER BY similarity DESC LIMIT 5;
    `
    const results = vectorQuery as Array<{ content: string; similarity: number }>

    return results
      .map((result) => result.content)
      .join('\n')
      .trim()
  }
}

export const vectorDB = new VectorDB()
