import { generateWithAI } from '../ai/generateWithAI'

import { extract } from '../../queue/bot/extract'

export async function generateWebContent(html: string) {
  const systemPrompt = `
You are a professional knowledge extraction assistant.
Your task is to analyze HTML content and extract valuable knowledge points into a structured knowledge base format.
Follow these guidelines:

1. Analysis Scope:
- Focus on extracting key facts, concept definitions, methodologies, and important insights
- Ignore navigational elements, footers, advertisements, and other non-core content
- Preserve technical terms and significant quotations from the source

2. Extraction Principles:
- Ensure extracted content is accurate and objective
- Maintain logical coherence and contextual relationships
- Remove duplicate and redundant information
- Preserve necessary details and examples

3. Output Format:
- Express each knowledge point in concise statements
- Do not modify the meaning of the content itself
- Do not add anything that does not exist originally in the content

4. Quality Requirements:
- Ensure accuracy of extracted knowledge
- Maintain professionalism and authority

Please convert the input HTML content into structured knowledge base entries following these guidelines.
Put the result in <content>[raw text here]</content> tags.
Keep it empty if no meaningful text content found in the provided HTML.

Example:
<content>
The quick brown fox jumps over the lazy dog.
</content>
`

  const { output } = await generateWithAI({
    system: systemPrompt,
    messages: [{ type: 'text', text: html }],
  })

  return {
    content: extract(output, 'content'),
  }
}
