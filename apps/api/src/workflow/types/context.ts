import { Agent } from '@prisma/client'
import { ActionPayload } from './action'
import { TriggerType } from './trigger'
import { Telegraf } from 'telegraf'
import { prisma } from '@repo/db'
import { Workspace } from './workspace'
import { Artifact } from './artifact'
import { Plugin } from './plugin'
import { getAgentPlugin } from '../plugins'
import { CoreTool } from 'ai'
import { buildTool } from '../tools/builder'
import { sendDiscordTyping } from '../../utils/discord'

export class Context {
  public readonly agent: Agent
  public readonly trigger: Trigger
  public readonly workspace: Workspace = {}
  public readonly artifact: Artifact = { output: {} }
  public readonly prePlugins: Plugin[] = []
  public readonly postPlugins: Plugin[] = []

  constructor(trigger: Trigger) {
    this.trigger = trigger
    this.agent = trigger.agent
  }

  get telegramBot() {
    return this.agent.botToken ? new Telegraf(this.agent.botToken) : null
  }

  sendTelegramTyping(groupId: string, threadId?: string | null) {
    const message_thread_id = threadId ? parseInt(threadId) : undefined
    this.telegramBot?.telegram.sendChatAction(groupId, 'typing', { message_thread_id }).catch(console.error)
  }

  sendDiscordTyping(channelId: string) {
    if (this.agent.discordToken) {
      sendDiscordTyping({ discordToken: this.agent.discordToken, channelId }).catch(console.error)
    }
  }

  async loadPlugins() {
    const plugins = await prisma.agentPlugin.findMany({
      where: { agentId: this.agent.id, enabled: true },
      orderBy: { hook: 'asc' },
    })
    for (const { hook, name } of plugins) {
      const plugin = getAgentPlugin(name)
      if (!plugin) {
        continue
      }
      if (hook < 0) {
        this.prePlugins.push(plugin)
      }
      if (hook > 0) {
        this.postPlugins.push(plugin)
      }
    }
  }

  async executePrePlugins() {
    for (const plugin of this.prePlugins) {
      await plugin.execute(this)
    }
  }

  async executePostPlugins() {
    for (const plugin of this.postPlugins) {
      await plugin.execute(this)
    }
  }

  async getTools(): Promise<Record<string, CoreTool>> {
    const tools: Record<string, CoreTool> = {}
    const agent = await prisma.agent.findUnique({
      where: { id: this.agent.id },
      include: { agentTools: true },
    })
    const agentTools = agent?.agentTools ?? []
    for (const agentTool of agentTools) {
      console.info('add agent tool:', agentTool.name)
      tools[agentTool.name] = buildTool(agentTool)
    }
    return tools
  }
}

// orchestrate the execution of tasks
export abstract class Trigger {
  abstract readonly type: TriggerType
  abstract readonly agent: Agent

  abstract buildTasks(context: Context): Promise<Array<new () => Task>>
}

// load payload from workspace
export abstract class Task {
  abstract buildActions(context: Context): Promise<Array<Action> | undefined>
}

// load payload from contructor
export abstract class Action {
  abstract payload: ActionPayload

  abstract execute(context: Context): Promise<void>
}
