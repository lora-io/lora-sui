import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import path from 'node:path'
import imageType from 'image-type'
import { HTTP } from '../http'

export async function uploadBotAvatarByTelegram(fileLink: URL) {
  const response = await HTTP.get(fileLink.href, {
    decompress: false,
    responseType: 'arraybuffer',
  })
  const filename = path.basename(fileLink.pathname)
  return uploadFile(`agent/avatar/${Date.now()}_${filename}`, response.data)
}

export async function uploadArtifactImage(imageBuffer: Buffer) {
  try {
    const type = imageType(imageBuffer)
    if (!type) {
      return null
    }
    return uploadFile(`agent/artifact/${Date.now()}.${type.ext}`, imageBuffer)
  } catch (error) {
    return null
  }
}

export async function uploadFile(filePath: string, data: any) {
  const REGION = 'us-east-1'
  const s3 = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_KEY ?? '',
      secretAccessKey: process.env.AWS_SECRET ?? '',
    },
  })

  await s3.send(
    new PutObjectCommand({
      Bucket: 'cdn.mylora.xyz',
      Key: filePath,
      Body: data,
    }),
  )
  return `https://cdn.mylora.xyz/${filePath}`
}
