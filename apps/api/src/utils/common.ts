export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function reportError(error: Error) {
  console.error(error)
}

export function getImageFormatFromUrl(url: string): 'gif' | 'jpeg' | 'png' | 'webp' | null {
  const match = url.match(/\.([^.?]+)(?:\?|$)/i)
  const ext = match ? match[1].toLowerCase() : null
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'jpeg'
    case 'png':
      return 'png'
    case 'webp':
      return 'webp'
    case 'gif':
      return 'gif'
    default:
      console.error(`Unsupported image format: ${ext}`)
      return null
  }
}

export function purifyMessage(text: string) {
  return text.replace(/(\*[^*]*\*)|(<b>.*?<\/b>)/g, '').trim()
}
