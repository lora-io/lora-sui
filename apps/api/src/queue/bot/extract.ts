export function extract(text: string, tag: string, fuzzy = false) {
  let content: string | null = null

  const regex = new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`, 'i')
  const match = text && text.match ? text.match(regex) : null
  if (match) {
    const result = match[0].replace(new RegExp(`</?${tag}>`, 'gi'), '').trim()
    content = result.length > 0 ? result : null
  }

  // ignore no close error
  if (fuzzy && !content) {
    if (text.includes(`<${tag}>`) && !text.includes(`</${tag}>`)) {
      content = text.split(`<${tag}>`)[1]
    } else if (text.includes(`</${tag}>`) && !text.includes(`<${tag}>`)) {
      content = text.split(`</${tag}>`)[0]
    }
  }

  return content
}
