import { embedMany } from 'ai'
import { embeddingModel } from './config'
import { EmbeddingModelV1Embedding } from '@ai-sdk/provider'

export async function generateEmbeddings(
  chunks: string[],
): Promise<{ content: string; embedding: EmbeddingModelV1Embedding }[]> {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  })
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }))
}
