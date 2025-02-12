export function chunkText(
  text: string,
  {
    maxLength = 1500,
    minLength = 100,
    overlap = 200,
  }: {
    maxLength?: number
    minLength?: number
    overlap?: number
  } = {},
): string[] {
  // First split by paragraphs
  const paragraphs = text.split(/\n\s*\n|\s{2,}/)
  const chunks: string[] = []
  let currentChunk = ''

  for (const paragraph of paragraphs) {
    // If paragraph is too long, split it into sentences
    if (paragraph.length > maxLength) {
      // Push current chunk if exists
      if (currentChunk) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
      }

      // Split long paragraph into sentences
      const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph]
      let sentenceChunk = ''

      for (const sentence of sentences) {
        if ((sentenceChunk + sentence).length > maxLength) {
          if (sentenceChunk) {
            chunks.push(sentenceChunk.trim())
            // Keep some overlap for context
            sentenceChunk = sentences[sentences.length - 1] || ''
          }
          sentenceChunk = sentence
        } else {
          sentenceChunk += ' ' + sentence
        }
      }

      if (sentenceChunk) {
        currentChunk = sentenceChunk.trim()
      }
    } else {
      // Handle normal paragraphs
      if ((currentChunk + paragraph).length > maxLength) {
        chunks.push(currentChunk.trim())
        currentChunk = paragraph
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph
      }
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim())

  // Post-process chunks
  return chunks
    .filter((chunk) => chunk.length >= minLength)
    .map((chunk, i, arr) => {
      // Add overlap with previous chunk if possible
      if (i > 0) {
        const prevChunk = arr[i - 1]
        const overlapText = prevChunk.slice(-overlap)
        if (overlapText && !chunk.startsWith(overlapText)) {
          return overlapText + '\n\n' + chunk
        }
      }
      return chunk
    })
}
