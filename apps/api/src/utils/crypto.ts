import crypto from 'node:crypto'

export function sha256(content: string) {
  const hash = crypto.createHash('sha256')
  hash.update(Buffer.from(content))
  return hash.digest('hex')
}

export function getMessageText() {
  return `By signing, you are proving you own this wallet and logging in mylora.xyz.`
}
