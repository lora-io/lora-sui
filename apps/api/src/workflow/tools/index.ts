import { Tool } from 'ai'
import { math } from './math'
import { fetch } from './fetch'
import { twitterSui } from './twitterSui'
import { searchToken } from './searchToken'

type FunctionTool = Tool & { description?: string }
export const ALL_TOOLS: Record<string, FunctionTool> = { math, fetch, twitterSui, searchToken }
export const ALL_TOOLS_NAMES: (keyof typeof ALL_TOOLS)[] = Object.keys(ALL_TOOLS)
