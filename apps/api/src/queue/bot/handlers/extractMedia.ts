import { CommonMessageBundle, ServiceMessageBundle } from '@telegraf/types'

export function extractMedia(message: ServiceMessageBundle | CommonMessageBundle) {
  let text = ''
  let fileId: string | null = null

  if ('text' in message) {
    text = message.text
  } else if ('caption' in message && message.caption) {
    text = message.caption
  }

  if ('photo' in message) {
    fileId = message.photo[message.photo.length - 1]?.file_id
  }
  if ('sticker' in message) {
    fileId = message.sticker.file_id
  }
  if ('document' in message) {
    const { file_id, file_size } = message.document
    if (file_size && file_size < 5_000_000) {
      fileId = file_id
    }
  }

  return {
    messageText: text.trim(),
    fileId,
  }
}
