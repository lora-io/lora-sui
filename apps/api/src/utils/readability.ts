import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio'

export class LinkContentExtractor {
  static async extractFromUrl(url: string) {
    try {
      const loader = new CheerioWebBaseLoader(url, {})
      const docs = await loader.load()

      return {
        content: docs.map((i) => i.pageContent).join('\n\n'),
      }
    } catch (error) {
      throw new Error(`Failed to fetch URL: ${error}`)
    }
  }
}
