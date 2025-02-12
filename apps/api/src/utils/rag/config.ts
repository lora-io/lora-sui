import { EmbeddingModelV1 } from '@ai-sdk/provider'
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'

const bedrock = createAmazonBedrock({
  bedrockOptions: {
    region: 'us-west-2',
    credentials: {
      accessKeyId: process.env.AWS_KEY ?? '',
      secretAccessKey: process.env.AWS_SECRET ?? '',
    },
  },
})
export const embeddingModel: EmbeddingModelV1<string> = bedrock.embedding('amazon.titan-embed-text-v1')
