import { mergeRouters } from '../trpc'
import { agentCreateRouter } from './agent/create'
import { agentUpdateRouter } from './agent/update'
import { agentGetRouter } from './agent/get'
import { agentAttachmentRouter } from './agent/attachment'

export const agentRouter = mergeRouters(agentCreateRouter, agentUpdateRouter, agentGetRouter, agentAttachmentRouter)
