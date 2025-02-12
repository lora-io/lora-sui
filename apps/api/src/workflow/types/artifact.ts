// for actions
type ArtifactData = {
  text?: string
  imageBuffer?: Buffer | null
}

export type Artifact = {
  message?: {
    type: 'telegram' | 'discord'
    result: ArtifactData
  }
  twitter?: {
    action: 'post' | 'reply' | 'quote'
    link: string
    result: ArtifactData
  }
  output: ArtifactData
}
